require Logger

defmodule Serverboards.RulesV2.Rule do
  def start_link(rule, options \\ []) do

    options = [name: via(rule["uuid"])] ++ options

    GenServer.start_link(__MODULE__, rule, options)
  end

  def via(rule_uuid) do
    {:via, Registry, {:rules_registry, rule_uuid}}
  end

  def trigger(rule_id, params) do
    GenServer.cast(rule_id, {:trigger, params})
  end

  ## Server impl

  def init(rule) do
    Logger.info("Starting rule #{inspect rule}")
    uuid = rule["uuid"]

    {:ok, trigger} = start_trigger(uuid, rule["when"])

    Logger.debug("Got trigger #{inspect trigger}")

    {:ok, %{
      trigger: trigger,
      rule: rule,
      uuid: uuid,
      }}
  end

  def start_trigger(uuid, w) do
    [trigger] = Serverboards.Rules.Trigger.find(id: w["trigger"])
    {:ok, plugin_id} = Serverboards.Plugin.Runner.start(trigger.command, "system/rule_v2")

    {:ok, client} = Serverboards.Plugin.Runner.client plugin_id
    setup_client_for_rules(self(), uuid, client)

    default_params = %{
      id: uuid,
    }

    params = Map.merge(w["params"], default_params)
    paramsdef = [%{ "name" => "id", "value" => uuid }] ++ Map.get(trigger.start, "params", [])
    method = Map.put( trigger.start, "params", paramsdef )
    {:ok, stop_id} = Serverboards.Plugin.Runner.call( plugin_id, method, params )
    stop_id = if stop_id do stop_id else uuid end

    {:ok, %{
      plugin_id: plugin_id,
      stop_id: stop_id,
    }}
  end

  def setup_client_for_rules(pid, uuid, %MOM.RPC.Client{} = client) do
    MOM.RPC.Client.add_method client, "trigger", fn
      [params] ->
        if uuid == (List.first(params)) do
          trigger(pid, params)
        end
      %{} = params ->
        if uuid == params["id"] do
          trigger(pid, params)
        end
    end
  end


  def handle_cast({:trigger, params}, state) do
    Logger.info("Trigger! #{inspect params} #{inspect state}")
    for action <- state.rule["actions"] do
      execute_action(state.uuid, action, %{ "A" => params})
    end
    {:noreply, state}
  end

  def execute_action(uuid, %{
      "type" => "action",
      "action" => action,
      "params" => params
      }, state) do
    Logger.info("Execute action: #{inspect action}(#{inspect params}) // #{inspect state}")
    result = Serverboards.Action.trigger_wait(action, params, "rule/#{uuid}")

    result = if Enum.count(result)==1 and Map.has_key?(result, :result) do
      result[:result] else result end

    Logger.info("Result is #{inspect result}")
    {:ok, result}
  end

end
