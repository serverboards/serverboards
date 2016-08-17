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
    [trigger] = find id: triggerid
    start(trigger, params, cont)
  end

  def stop(uuid) do
    GenServer.call(Serverboards.Rules.Trigger, {:stop, uuid})
  end

  def get_trigger(uuid) do
    GenServer.call(Serverboards.Rules.Trigger, {:get_trigger, uuid})
  end

  def setup_client_for_rules(client) do
    #Logger.debug("Method caller of this trigger #{inspect client}")
    MOM.RPC.Client.add_method client, "trigger", fn params ->
      trigger = get_trigger(params["id"])
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
    params = Map.put(params, :id, uuid)
    {:ok, stop_id} = Plugin.Runner.call( plugin_id, trigger.start, params )
    stop_id = if stop_id do stop_id else uuid end

    {:reply, uuid, %{
      triggers: Map.put(state.triggers, uuid, %{ trigger: trigger, cont: cont, plugin_id: plugin_id, stop_id: stop_id })
      }}
  end

  def handle_call({:stop, uuid}, _from, state) do
    if uuid in state.triggers do
      trigger=state.triggers[uuid]
      Plugin.Runner.call( trigger.plugin_id, trigger.trigger.stop, trigger.stop_id )
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
