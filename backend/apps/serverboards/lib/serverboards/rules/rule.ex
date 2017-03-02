require Logger

defmodule Serverboards.Rules.Rule do
  defmodule CantStartRule do
    defexception message: "Cant start rule"
  end

  alias Serverboards.Plugin

  defstruct [
    uuid: nil,
    is_active: false,
    project: nil,
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

  def setup_client_for_rules(_pid, %MOM.RPC.Client{} = client) do
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
    Process.flag(:trap_exit, true)
    {:ok, {}}
  end

  def terminate(_reason, {}) do
    #Logger.error("Stopping before properly started. Error at setting up.")
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
  def terminate(_reason, %{ plugin_id: plugin_id, rule: rule} = state) do
    case Serverboards.ProcessRegistry.get(Serverboards.Rules.Registry, plugin_id) do
      nil ->
        if state.trigger.stop do
          Logger.info("Calling stop: #{plugin_id}.#{inspect state.trigger.stop}(#{inspect state.stop_id})", rule: rule)
          case Plugin.Runner.call( plugin_id, state.trigger.stop, [state.stop_id] ) do
            {:ok, true} -> :ok
            res ->
              Logger.error("Error stopping rule #{inspect rule.uuid} when calling stop: #{inspect res}", rule: rule, res: res)
          end
        else
          Logger.warn("Rule #{inspect rule.uuid} stop is not handled in any way. May need a stop method, or not be a singleton.", rule: rule)
        end
      pid ->
        Logger.info("Terminate rule, stopping plugin.", rule: rule)
        Serverboards.Plugin.Runner.stop(pid)
    end
    :ok
  end
  def terminate(_reason, _) do
    :ok
  end

  @doc ~S"""
  Gets the default params for both the trigger and actions, updated from
  database.

  If they are needed in the trigger/action it will have properly all the data.
  """
  def get_default_params(%{ service: service, rule: rule }) do
    default_params = if service != nil do
      Serverboards.Service.service_config(service)
        |> Map.put(:service, Serverboards.Service.decorate(service))
    else
      %{ service: nil }
    end
    default_params = if rule do
      default_params
        |> Map.put(:rule, Serverboards.Rules.decorate(rule))
    else
      default_params
    end

    default_params
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
    # it up to date with the new data.
    default_params = get_default_params(%{ service: service, rule: uuid})
    params = Map.merge(params, default_params)

    Logger.info("Start rule with trigger #{inspect trigger}, #{uuid}", uuid: uuid, trigger: trigger, params: params, actions: actions)
    [trigger] = Serverboards.Rules.Trigger.find(id: trigger)
    plugin_id = case Plugin.Runner.start trigger.command do
      {:ok, plugin_id} -> plugin_id
      {:error, desc} ->
        Logger.error("Could not start trigger", description: desc)
        raise CantStartRule, message: to_string(desc)
    end

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

    {res, _uuid, triggerdata} = case call_response do
      {:ok, stop_id} ->
        stop_id = if stop_id do stop_id else uuid end

        #Logger.info("Starting rule #{inspect trigger.id} // #{uuid}", trigger: trigger, uuid: uuid)
        state = %{
          trigger: trigger,
          params: params,
          actions: actions,
          plugin_id: plugin_id,
          stop_id: stop_id,
          rule: rule,
          last_state: rule.last_state,
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
    %{ id: _id, state: rule_state } = params

    %{
      plugin_id: plugin_id,
      trigger: trigger,
      actions: actions,
      rule: rule
    } = state
    Plugin.Runner.ping(plugin_id) # to keep it alive

    action = actions[rule_state]

    full_params = Map.merge(params, %{ trigger: trigger.id })
    default_params = get_default_params( %{ service: rule.service, rule: rule.uuid } )

    # set last state
    EventSourcing.dispatch(Serverboards.Rules.EventSourcing, :set_state, %{ rule: rule.uuid, state: rule_state }, "rule/#{rule.uuid}")

    if action do
      # only trigger if state change or only one state (ticks)
      if (state.last_state != rule_state) or (Enum.count(state.actions) == 1) do
        full_params = Map.merge( Map.merge(action.params, default_params), full_params )
        Logger.info("Trigger action #{inspect rule_state} from rule #{rule.trigger.trigger} // #{rule.uuid}", rule: rule, params: full_params, action: action)
        Serverboards.Action.trigger(action.action, full_params, %{ email: "rule/#{rule.uuid}", perms: []})
      else
        Logger.info("NOT triggering action #{inspect rule_state} from rule #{rule.trigger.trigger} // #{rule.uuid}. State did not change.", rule: rule, params: full_params, action: action)
      end
    else
        Logger.info("Trigger empty action #{inspect rule_state} from rule #{rule.trigger.trigger} // #{rule.uuid}", rule: rule, params: [], action: action)
        {:ok, :empty}
    end
    state = %{ state | last_state: rule_state }

    {:reply, :ok, state}
  end

  def handle_info({:EXIT, _pid, :normal}, status) do
    #Logger.info("Got EXIT normal")
    terminate(:normal, status)
    {:noreply, status}
  end
end
