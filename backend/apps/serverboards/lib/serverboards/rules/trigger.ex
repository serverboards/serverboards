require Logger

defmodule Serverboards.Rules.Trigger do

  alias Serverboards.Plugin
  def start_link options \\ [] do
    GenServer.start_link __MODULE__, :ok, options
  end

  @doc ~S"""
  Returns the list of possible triggers for the given filter.

  The filter is as in Plugin.Registry.filter_component
  """
  def find(filter \\ []) do
    Plugin.Registry.filter_component([type: "trigger"] ++ filter)
     |> Enum.map(fn tr ->
       states = case tr.extra["states"] do
         l when is_list(l) -> l
         str when is_binary(str) -> String.split(str)
       end
       command = tr.extra["command"]
       #Logger.debug("Command is #{inspect command}")
       command = if String.contains?(command, "/") do
         command
       else
         "#{tr.plugin}/#{command}"
       end

       %{
         name: tr.name,
         description: tr.extra["description"],
         traits: tr.traits,
         command: command,
         start: tr.extra["start"],
         stop: tr.extra["stop"],
         id: tr.id,
         states: states
       }
      end)
  end

  @doc ~S"""
  Executes the command for a trigger
  """
  def start(trigger, params, cont) when is_map(trigger) do
    uuid = GenServer.call(Serverboards.Rules.Trigger, {:start, trigger, params, cont})
    {:ok, uuid}
  end
  def start(triggerid, params, cont) when is_binary(triggerid) do
    case find id: triggerid do
      [trigger] ->
        start(trigger, params, cont)
      [] ->
        Logger.error("Could not find trigger #{triggerid}", trigger: triggerid)
    end
  end

  def stop(uuid) do
    GenServer.call(Serverboards.Rules.Trigger, {:stop, uuid})
  end

  def get_trigger(uuid) do
    GenServer.call(Serverboards.Rules.Trigger, {:get_trigger, uuid})
  end

  def setup_client_for_rules(%MOM.RPC.Client{} = client) do
    #Logger.debug("Method caller of this trigger #{inspect client}")
    MOM.RPC.Client.add_method client, "trigger", fn
      [params] ->
        trigger_real(params)
      %{} = params ->
        trigger_real(params)
    end
  end

  def trigger_real(params) do
    case get_trigger(params["id"]) do
      nil ->
        Logger.warn("Invalid trigger triggered (#{params["id"]}). Check plugin trigger function.", params: params)
        {:error, :not_found}
      trigger ->
        Logger.debug("Trigger #{inspect trigger.trigger.id}, #{inspect params}")
        Plugin.Runner.ping(trigger.plugin_id)

        params = Map.merge(params, %{ trigger: trigger.trigger.id, id: params["id"] })
        trigger.cont.(params)
    end
  end

  # impl
  def init(:ok) do
    {:ok, %{
      triggers: %{}
      }}
  end

  def handle_call({:start, trigger, params, cont}, _from, state) do
    {:ok, plugin_id} = Plugin.Runner.start trigger.command
    {:ok, client} = Plugin.Runner.client plugin_id
    setup_client_for_rules client # can setup over without any problem. If not would need to setup only once.

    uuid = UUID.uuid4
    method = %{ trigger.start | "params" => [%{ "name" => "id", "value" => uuid }] ++ trigger.start["params"] }
    {:ok, stop_id} = Plugin.Runner.call( plugin_id, method, params )
    stop_id = if stop_id do stop_id else uuid end

    Logger.info("Starting trigger #{inspect trigger.id} // #{uuid}", trigger: trigger, uuid: uuid)

    {:reply, uuid, %{
      triggers: Map.put(state.triggers, uuid, %{ trigger: trigger, cont: cont, plugin_id: plugin_id, stop_id: stop_id })
      }}
  end

  def handle_call({:stop, uuid}, _from, state) do
    Logger.debug("Try to stop trigger #{inspect uuid}")
    if Map.has_key?(state.triggers, uuid) do
      trigger=state.triggers[uuid]
      Logger.debug("#{inspect Map.keys(trigger)}")
      Plugin.Runner.call( trigger.plugin_id, trigger.trigger.stop, [trigger.stop_id] )
      Logger.info("Stopping trigger #{inspect trigger.trigger.id} // #{uuid}", trigger: trigger, uuid: uuid)
      {:reply, :ok, %{ state |
        triggers: Map.drop(state.triggers, [uuid])}}
    else
      {:reply, {:error, :not_found}, state}
    end
  end

  def handle_call({:get_trigger, uuid}, _from, state) do
    {:reply, state.triggers[uuid], state}
  end
end
