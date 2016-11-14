require Logger

defmodule Serverboards.Plugin.Runner do
  @moduledoc ~S"""
  Server that stats plugins and connects the RPC channels.

  Every started plugin has an UUID as id, and that UUID is later used
  for succesive calls using the runner.

  An UUID is used as ID as it can be considered an opaque secret token to
  identify the clients that can be passed around.
  """
  use GenServer
  alias Serverboards.Plugin


  def start_link (options \\ []) do
    {:ok, pid} = GenServer.start_link __MODULE__, :ok, options

    MOM.Channel.subscribe(:auth_authenticated, fn msg ->
      %{ user: _user, client: client} = msg.payload
      MOM.RPC.Client.add_method_caller client, Serverboards.Plugin.Runner.method_caller
      :ok
    end)

    {:ok, pid}
  end

  @doc ~S"""
  Starts a component by name and adds it to the running registry.

  Example:

    iex> {:ok, cmd} = start("serverboards.test.auth/fake")
    iex> call cmd, "ping"
    {:ok, "pong"}
    iex> stop(cmd)
    true

  Or if does not exist:

    iex> start("nonexistantplugin")
    {:error, :not_found}

  It can also be called with a component struct:

    iex> component = hd (Serverboards.Plugin.Registry.filter_component trait: "auth")
    iex> {:ok, cmd} = start(component)
    iex> call cmd, "ping"
    {:ok, "pong"}
    iex> stop(cmd)
    true

  """
  def start(%Serverboards.Plugin.Component{} = component) do
    case GenServer.call(Serverboards.Plugin.Runner, {:get_by_component_id, component.id}) do
      {:ok, uuid} ->
        #Logger.debug("Already running: #{inspect component.id} / #{inspect uuid}")
        ping(uuid)
        {:ok, uuid}
      {:error, :not_found} ->
      case Plugin.Component.run component do
        {:ok, pid } ->
          require UUID
          uuid = UUID.uuid4
          Logger.debug("Adding runner #{uuid} #{inspect component.id}")
          :ok = GenServer.call(Serverboards.Plugin.Runner, {:start, uuid, pid, component})
          {:ok, uuid}
        {:error, {:timeout, _where}} ->
          Logger.error("Timeout starting plugin component #{inspect component.id}")
          {:error, :timeout}
        {:error, e} ->
          Logger.error("Error starting plugin component #{inspect component.id}: #{inspect e}")
          {:error, e}
      end
    end
  end
  def start(plugin_component_id)
  when is_binary(plugin_component_id) do
      case Serverboards.Plugin.Registry.find(plugin_component_id) do
        nil ->
          Logger.error("Plugin component #{plugin_component_id} not found")
          {:error, :not_found}
        c ->
          start(c)
      end
  end

  def stop(uuid) do
    case GenServer.call(Serverboards.Plugin.Runner, {:stop, uuid}) do
      {:error, :cant_stop} -> # just do not log it, as it is quite normal
        #Logger.debug("Non stoppable plugin to stop #{inspect uuid}")
        {:error, :cant_stop}
      {:error, e} ->
        Logger.error("Error stopping component #{inspect e}")
        {:error, e}
      {:ok, cmd} ->
        #Logger.debug("Stop plugin #{inspect uuid}")
        Serverboards.IO.Cmd.stop cmd
        true
    end
  end

  @doc ~S"""
  Marks that this plugin has been used, for timeout pourposes
  """
  def ping(uuid) do
    GenServer.cast(Serverboards.Plugin.Runner, {:ping, uuid})
    :ok
  end

  @doc ~S"""
  Returns method caller, so that it can be added to an authenticated client

  ## Example:

    iex> alias Test.Client
    iex> {:ok, client} = Client.start_link as: "dmoreno@serverboards.io"
    iex> {:ok, pl} = Client.call client, "plugin.start", ["serverboards.test.auth/fake"]
    iex> is_binary(pl)
    true
    iex> Client.call client, "plugin.call", [pl, "ping",[]]
    {:ok, "pong"}
    iex> Client.call client, "plugin.call", [pl, "ping"]
    {:ok, "pong"}
    iex> Client.call client, "plugin.stop", [pl]
    {:ok, true}

  """
  def method_caller(runner) do
    GenServer.call(Serverboards.Plugin.Runner, {:method_caller})
  end
  def method_caller do
    method_caller(Serverboards.Plugin.Runner)
  end

  @doc ~S"""
  Rerurns the RPC client of a given uuid
  """
  def client(uuid) when is_binary(uuid) do
    case get(uuid) do
      %{ pid: pid }  ->
        client = Serverboards.IO.Cmd.client pid
        {:ok, client}
      nil ->
        {:error, :not_found}
    end
  end

  @doc ~S"""
  Returns the associated cmd struct to this uuid
  """
  def get(uuid) when is_binary(uuid) do
    GenServer.call(Serverboards.Plugin.Runner, {:get, uuid})
  end

  @doc ~S"""
  Calls a runner started command method.

  id is an opaque id that can be passed around to give access to this command.

  Examples:

    iex> {:ok, cmd} = start "serverboards.test.auth/fake"
    iex> call cmd, "ping"
    {:ok, "pong"}
    iex> call cmd, "unknown"
    {:error, :unknown_method}
    iex> stop cmd
    true

  If passing and unknown or already stopped cmdid

    iex> call "nonvalid", "ping"
    {:error, :unknown_method}

    iex> {:ok, cmd} = start "serverboards.test.auth/fake"
    iex> stop cmd
    iex> call cmd, "ping"
    {:error, :unknown_method}

  The method can be both a binary or a map, if the method is a map, it is a map
  in the form

      %{ "method" => "...", "params" => [ %{ "name" => "...", ...} ] }

  Then then params in the method definition are used to filter the passed `params`,
  and the method name is at `method`. This enables the use of simple method
  calls or more complex with a list of possible parameters, and then filter.
  Necessary for triggers with service config as values, for example.

    iex> {:ok, cmd} = start "serverboards.test.auth/fake"
    iex> call cmd, %{ "method" => "pingm", "params" => [ %{ "name" => "message" } ] }, %{ "message" => "Pong", "ingored" => "ignore me"}
    {:ok, "Pong"}

  """
  def call(id, method, params) when (is_binary(id) and is_binary(method)) do
    case GenServer.call(Serverboards.Plugin.Runner, {:get, id}) do
      :not_found ->
        Logger.error("Could not find plugin id #{inspect id}: :not_found")
        {:error, :unknown_method}
      :exit ->
        {:error, :exit}
      %{ pid: pid } when is_pid(pid) ->
        GenServer.cast(Serverboards.Plugin.Runner, {:ping, id})
        #Logger.debug("Plugin runner call #{inspect method}(#{inspect params})")
        case Serverboards.IO.Cmd.call pid, method, params do
          {:error, :exit} ->
            GenServer.call(Serverboards.Plugin.Runner, {:exit, id}) # just exitted, mark it
            {:error, :exit}
          other -> other
        end
    end
  end
  # map version
  def call(id, %{ "method" => method } = defcall, defparams) when is_binary(id) do
    defparams = Map.new(Map.to_list(defparams) |> Enum.map(fn {k,v} -> {to_string(k), v} end))
    params = Map.get(defcall,"params",[]) |> Enum.map( fn %{ "name" => name } = param ->
      # this with is just to try to fetch in order or nil
      value = with :error <- Map.fetch(defparams, to_string(name)),
                   :error <- Map.fetch(param, "default"),
                   :error <- Map.fetch(param, "value")
              do
                nil
              else
                {:ok, value} -> value
              end
      {name, value}
    end ) |> Map.new
    call(id, method, params)
  end
  def call(id, method) do
    call(id, method, %{})
  end

  @doc ~S"""
  Simple call to do the full cycle of start a plugin, call a method and stop it.
  """
  def start_call_stop(command_id, method, params) do
    case start(command_id) do
      {:error, e} -> {:error, e}
      {:ok, uuid} ->
        res = call(uuid, method, params)
        stop(uuid)
        res
    end
  end

  #def cast(id, method, params, cont) do
  #  runner = Serverboards.Plugin.Runner
  #  case GenServer.call(runner, {:get, id}) do
  #    :not_found ->
  #      Logger.error("Could not find plugin id #{inspect id}: :not_found")
  #      cont.({:error, :unknown_method})
  #    cmd when is_pid(cmd) ->
  #      Serverboards.IO.Cmd.cast cmd, method, params, cont
  #  end
  #end


  def status(uuid) do
    GenServer.call(Serverboards.Plugin.Runner, {:status, uuid})
  end

  ## server impl
  def init :ok do
    #Logger.info("Plugin runner ready #{inspect self()}")

    {:ok, method_caller} = Serverboards.Plugin.RPC.start_link()

    {:ok, %{
      method_caller: method_caller,
      running: %{}, # UUID -> %{ pid, component, timeout }
      by_component_id: %{}, # component_id -> UUID, only last
      timeouts: %{}
      }}
  end

  def handle_call({:get_by_component_id, component_id}, _from, state) do
    ret = case Map.get(state.by_component_id, component_id, false) do
      false -> {:error, :not_found}
      uuid -> {:ok, uuid}
    end
    {:reply, ret, state}
  end
  def handle_call({:start, uuid, pid, component}, _from, state) do
    #Logger.debug("Component start #{component.id}")
    # get strategy and timeout
    {timeout, strategy} = case Map.get(component.extra, "strategy", "one_for_one") do
      "one_for_one" ->
        timeout = Serverboards.Utils.timespec_to_ms!(Map.get(component.extra, "timeout", "5m"))
        {timeout, :one_for_one}
      "singleton" ->
        timeout = Serverboards.Utils.timespec_to_ms!(Map.get(component.extra, "timeout", "5m"))
        {timeout, :singleton}
      "init" ->
        {:never, :init}
    end
    # prepare timeout
    state = if timeout != :never do
      {:ok, timeout_ref} = :timer.send_after( timeout, self, {:timeout, uuid})
      #Logger.debug("new timer #{inspect timeout_ref} #{inspect timeout} #{inspect strategy}")
      %{ state |
        timeouts: Map.put(state.timeouts, uuid, timeout_ref)
      }
    else
      state
    end

    # add entry to main running dict
    entry = %{
      pid: pid,
      component: component,
      timeout: timeout,
      strategy: strategy
    }
    state = %{ state |
      running: Map.put(state.running, uuid, entry )
    }

    # if singleton or init, add to by component_id dict
    state = if strategy in [:singleton, :init] do
      state = %{ state | by_component_id: Map.put(state.by_component_id, component.id, uuid) }
    else
      state
    end

    # all systems go
    {:reply, :ok, state}
  end
  def handle_call({:stop, uuid}, _from, state) do
    #Logger.debug("Stop plugin #{uuid}")
    entry = state.running[uuid]
    cond do
      entry == nil ->
        {:reply, {:error, :not_running}, state }
      entry.strategy == :one_for_one ->
        # Maybe remove from timeouts
        :timer.cancel(state.timeouts[uuid])
        running = Map.drop(state.running, [uuid])

        # only applicable to one_for_one
        state = %{ state |
          running: running,
          timeouts: Map.drop(state.timeouts, [uuid])
        }

        {:reply, {:ok, entry.pid}, state }
      true ->
        #Logger.debug("Will not stop plugin, strategy is #{entry.strategy}")
        {:reply, {:error, :cant_stop}, state}
    end
  end
  def handle_call({:method_caller}, _from, state) do
    {:reply, state.method_caller, state}
  end
  def handle_call({:get, id}, _from, state) do
    {:reply, Map.get(state.running, id, :not_found), state}
  end
  def handle_call({:status, uuid}, _from, state) do
    status = if Map.has_key?(state.running, uuid) do :running else :not_running end
    {:reply, status, state}
  end
  def handle_call({:exit, uuid}, _from, state) do
    Logger.error("Unexpected exit process #{uuid}")
    state=case state.running[uuid] do
      nil ->
        state
      :exit ->
        state
      %{ component: component } ->
        :timer.cancel( state.timeouts[uuid] )
        state = %{ state |
          running: Map.put(state.running, uuid, :exit),
          by_component_id: Map.drop(state.by_component_id, [component.id]),
          timeouts: Map.drop(state.timeouts, [uuid])
        }
        MOM.Channel.send(:plugin_down, %MOM.Message{ payload: %{uuid: uuid, id: component.id}})
        :timer.send_after(60000, {:remove_uuid, uuid})
        state
    end

    {:reply, :ok, state}
  end

  def handle_cast({:ping, uuid}, state) do
    #Logger.debug("ping #{inspect uuid }")
    case state.timeouts[uuid] do
      nil ->
        {:noreply, state}
      oldref ->
        {:ok, :cancel} = :timer.cancel(oldref)
        timeout = state.running[uuid].timeout
        {:ok, newref} = :timer.send_after( timeout, self, {:timeout, uuid} )
        #Logger.debug("update timer #{inspect oldref} -> #{inspect newref}")
        {:noreply, %{ state | timeouts: Map.put(state.timeouts, uuid, newref) }}
    end
  end

  def handle_info({:timeout, uuid}, state) do
    {entry, running} = Map.pop(state.running, uuid, nil)
    if entry do
      Logger.info("Timeout process, stopping. #{inspect uuid} // #{inspect entry.component.id}",
        uuid: uuid, timeout: entry.timeout, strategy: entry.strategy, component: entry.component.id)
      Process.exit(entry.pid, :timeout)
      by_component_id = Map.drop(state.by_component_id, [entry.component.id])

      timeouts = Map.drop(state.timeouts, [uuid])
      {:noreply, %{ state |
        running: running,
        timeouts: timeouts,
        by_component_id: by_component_id
      }}
    else
      {:noreply, state}
    end
  end
  def handle_info({:remove_uuid, uuid}, state) do
    # Removes after 60s after a uuid failed, to return some {:error, :exit}, but not mem leak the uuid forever
    {:noreply, %{ state |
      running: Map.drop(state.running, [uuid])
    }}
  end

  def handle_info(any, state) do
    Logger.warn("New unknown info #{inspect any}")
    {:noreply, state}
  end
end
