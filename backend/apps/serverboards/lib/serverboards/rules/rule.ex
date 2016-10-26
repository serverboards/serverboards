require Logger

defmodule Serverboards.Rules.Rule do
  alias Serverboards.Rules.Model
  alias Serverboards.Repo
  alias Serverboards.Plugin

  defstruct [
    uuid: nil,
    is_active: false,
    serverboard: nil,
    service: nil,
    name: nil,
    description: nil,
    trigger: %{},
    actions: [],
    last_state: nil,
    from_template: nil # original template rule
  ]
  def start_link(rule, _options \\ []) do
    #Logger.debug("Start rule #{inspect rule.uuid}", rule: rule)

    {:ok, pid} = GenServer.start_link __MODULE__, {}
    Serverboards.ProcessRegistry.add(Serverboards.Rules.Registry, rule.uuid, pid)
    case GenServer.call(pid, {:init, rule}) do
      :ok ->
        {:ok, pid}
      {:error, _reason} ->
        GenServer.stop(pid)
        {:error, :cant_start}
    end
  end

  def stop(uuid) do
    Logger.info("Stop rule // #{uuid}", uuid: uuid)
    case Serverboards.ProcessRegistry.pop(Serverboards.Rules.Registry, uuid) do
      nil -> :ok
      pid ->
        Process.exit(pid, :normal)
        :ok
    end
  end

  def setup_client_for_rules(pid, %MOM.RPC.Client{} = client) do
    MOM.RPC.Client.add_method client, "trigger", fn
      [params] ->
        trigger_real(params)
      %{} = params ->
        trigger_real(params)
    end
  end

  def trigger_real(params) do
    #Logger.debug("Trigger real #{inspect params}")
    case Serverboards.ProcessRegistry.get(Serverboards.Rules.Registry, params["id"]) do
      nil ->
        Logger.error("Invalid trigger id #{inspect params["id"]}")
        {:error, :invalid}
      pid ->
        params = Serverboards.Utils.keys_to_atoms_from_list(params, ~w(id state))
        GenServer.call(pid, {:trigger, params } )
    end
  end

  ## server impl
  def init({}) do
    # 2 phase implementation, to get better error reporting, and handling.
    {:ok, {}}
  end

  def terminate(reason, {}) do
    # stopped before starting, on :init
    :ok
  end
  def terminate(reason, %{ trigger: trigger, uuid: uuid, plugin_id: plugin_id } = state) do
    if reason != :normal do
      Logger.error("Terminate, stop plugin if possible #{trigger.trigger} // #{uuid}", uuid: uuid, rule: state.rule)
    end
    case Serverboards.ProcessRegistry.get(Serverboards.Rules.Registry, plugin_id) do
      nil -> :ok
      pid ->
        Serverboards.Plugin.Runner.stop(pid)
    end
    :ok
  end
  def terminate(reason, %{ plugin_id: plugin_id} = state) do
    Logger.error("Terminate, stop plugin if possible.", state: state)
    case Serverboards.ProcessRegistry.get(Serverboards.Rules.Registry, plugin_id) do
      nil -> :ok
      pid ->
        Serverboards.Plugin.Runner.stop(pid)
    end
    :ok
  end
  def terminate(reason, _) do
    :ok
  end


  def handle_call({:init, rule}, _from, {}) do
    %{
      uuid: uuid,
      trigger: trigger,
      actions: actions,
      service: service
    } = rule
    params = trigger.params
    trigger = trigger.trigger


    # def params are gotten from service, and overwritten later.
    # this makes it easy to fill only required fields at UI and later
    # use service data to complete it, for example to change labels on the
    # selected service
    # Also if the service is modified then just restarting the rule make
    # it up to date with the new data. TODO
    default_params = if service != nil do
      Serverboards.Service.service_config(service)
        |> Map.put(:service, service)
    else
      %{ service: nil }
    end
    params = Map.merge(params, default_params)

    Logger.info("Start rule with trigger #{inspect trigger}, #{uuid}", uuid: uuid, trigger: trigger, params: params, actions: actions)
    [trigger] = Serverboards.Rules.Trigger.find(id: trigger)
    {:ok, plugin_id} = Plugin.Runner.start trigger.command
    self_ = self
    #MOM.Channel.subscribe(:plugin_down, fn %{ payload: %{uuid: ^plugin_id}} ->
    #  Process.exit(self_, :plugin_down) # sort of suicide if the cmd finishes
    #  :autoremove
    #end)
    {:ok, client} = Plugin.Runner.client plugin_id
    setup_client_for_rules(self, client)

    method = Map.put( trigger.start, "params", [%{ "name" => "id", "value" => uuid }] ++ Map.get(trigger.start, "params", []) )

    call_response = try do
      Plugin.Runner.call( plugin_id, method, params )
    catch # may cowardly exit the calling process (or already exited? just started!)
      :exit, _ -> {:error, :exit}
    end

    {res, uuid, triggerdata} = case call_response do
      {:ok, stop_id} ->
        stop_id = if stop_id do stop_id else uuid end

        #Logger.info("Starting rule #{inspect trigger.id} // #{uuid}", trigger: trigger, uuid: uuid)
        state = %{
          trigger: trigger,
          params: params,
          actions: actions,
          plugin_id: plugin_id,
          stop_id: stop_id,
          default_params: default_params,
          rule: rule
        }

        {:ok, uuid, state}
      {:error, error} ->
        Logger.error("Error starting rule #{inspect trigger.id}: #{inspect error}", error: error, trigger: trigger)
        {:error, :aborted, {}}
    end

    if res == :ok do
      {:reply, :ok, triggerdata}
    else
      {:reply, {:error, :cant_start}, {}}
    end
  end

  def handle_call({:trigger, params}, _from, state) do
    %{ id: id, state: rule_state } = params

    %{
      plugin_id: plugin_id,
      trigger: trigger,
      actions: actions,
      default_params: default_params,
      rule: rule
    } = state
    Plugin.Runner.ping(plugin_id) # to keep it alive

    action = actions[rule_state]

    full_params = Map.merge(params, %{ trigger: trigger.id })

    # set last state
    EventSourcing.dispatch(Serverboards.Rules.EventSourcing, :set_state, %{ rule: rule.uuid, state: rule_state }, "rule/#{rule.uuid}")

    if action do
        full_params = Map.merge( Map.merge(action.params, default_params), full_params )
        Logger.info("Trigger action #{inspect rule_state} from rule #{rule.trigger.trigger} // #{rule.uuid}", rule: rule, params: full_params, action: action)
        Serverboards.Action.trigger(action.action, full_params, %{ email: "rule/#{rule.uuid}", perms: []})
    else
        Logger.info("Trigger empty action #{inspect rule_state} from rule #{rule.trigger.trigger} // #{rule.uuid}", rule: rule, params: [], action: action)
        {:ok, :empty}
    end


    {:reply, :ok, state}
  end
end
