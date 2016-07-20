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
         call: tr.extra["call"],
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

  # impl
  def init(:ok) do
    {:ok, %{}}
  end

  def handle_call({:start, trigger, params, cont}, _from, running) do
    {:ok, uuid} = Plugin.Runner.start trigger.command

    Plugin.Runner.call( uuid, trigger.call["method"], params )

    {:ok, client} = Plugin.Runner.client uuid
    #Logger.debug("Method caller of this trigger #{inspect client}")
    MOM.RPC.Client.add_method client, "trigger", fn params ->
      Logger.debug("Trigger #{inspect trigger.id}, #{inspect params}")
      params = Map.merge(params, %{ uuid: uuid, trigger: trigger.id })
      try do # FIXME Use proper supervission tree for rules.
        cont.(params)
      catch
        :exit, _ ->
          Plugin.Runner.stop trigger.command
      end
    end

    {:reply, uuid,
      Map.put(running, uuid, trigger)
    }
  end

  def handle_call({:stop, uuid}, _from, running) do
    if uuid in running do
      true = Plugin.Runner.stop uuid
      {:reply, :ok, Map.drop(running, [uuid])}
    else
      {:reply, {:error, :not_found}, running}
    end
  end
end
