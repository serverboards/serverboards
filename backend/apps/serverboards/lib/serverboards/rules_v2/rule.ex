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
    when_id = Map.get(state.rule["when"], "id", "A")
    params = Map.merge( state.rule["when"]["params"], params )
    uuid = state.rule["uuid"]
    trigger_state = Map.put(%{ "uuid" => uuid}, when_id, params)

    Logger.info("Trigger! #{inspect params} #{inspect state}")
    {:ok, rule_final_state} = execute_actions(uuid, state.rule["actions"], trigger_state)
    Logger.info("Final state: #{inspect rule_final_state}")

    {:noreply, state}
  end

  def execute_actions(_uuid, [], state), do: {:ok, state}
  def execute_actions(uuid, [ action | rest ], state) do
    {:ok, state} = execute_action(uuid, action, state)
    execute_actions(uuid, rest, state)
  end

  def execute_action(uuid, %{
      "type" => "action",
      "action" => action,
      "params" => params
      } = actiondef, state) do
    Logger.info("Execute action: #{inspect action}(#{inspect params}) // #{inspect state}")
    result = Serverboards.Action.trigger_wait(action, params, "rule/#{uuid}")

    result = if Enum.count(result)==1 and Map.has_key?(result, :result) do
      result[:result] else result end

    action_id = Map.get(actiondef, "id")
    Logger.info("Result #{inspect action_id} is #{inspect result}")
    state = if action_id do Map.put(state, action_id, result)
      else state end

    {:ok, state}
  end


  def execute_action(uuid, %{
      "type" => "condition",
      "condition" => condition,
      "then" => then_actions,
      "else" => else_actions
      }, state) do
    {:ok, condition_result} = ExEval.eval(condition, [state])
    if condition_result do
      Logger.debug("#{inspect condition} -> true")
      state = execute_actions(uuid, then_actions, state)
    else
      Logger.debug("#{inspect condition} -> false")
      state = execute_actions(uuid, else_actions, state)
    end
  end

  def terminate(reason, state) do
    Logger.error("Terminate #{inspect reason}")
  end
end
