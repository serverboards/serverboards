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

    Serverboards.MOM.Channel.subscribe(:auth_authenticated, fn msg ->
      %{ user: user, client: client} = msg.payload
      if Enum.member?(user.perms, "plugin") do
        alias Serverboards.MOM.RPC
        RPC.add_method_caller (RPC.Client.get client, :to_serverboards), Serverboards.Plugin.Runner.method_caller
      end
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
  def start(runner, %Serverboards.Plugin.Component{} = component)
  when (is_pid(runner) or is_atom(runner)) do
    case Plugin.Component.run component do
      {:ok, cmd } ->
        require UUID
        uuid = UUID.uuid4
        Logger.debug("Adding runner #{uuid} #{inspect cmd} to #{inspect runner}")
        :ok = GenServer.call(runner, {:start, uuid, cmd})
        {:ok, uuid}
      {:error, e} ->
        Logger.error("Error starting plugin component #{inspect component}: #{inspect e}")
        {:error, e}
      end
    end
  def start(runner, plugin_component_id)
  when (is_pid(runner) or is_atom(runner)) and is_binary(plugin_component_id) do
      case Serverboards.Plugin.Registry.find(plugin_component_id) do
        nil -> {:error, :not_found}
        c ->
          start(runner, c)
      end
  end
  def start(component), do: start(Serverboards.Plugin.Runner, component)

  def stop(runner, id) do
    case GenServer.call(runner, {:pop, id}) do
      {:error, e} ->
        Logger.error("Error stoping component #{inspect e}")
        {:error, e}
      {:ok, cmd} ->
        Serverboards.IO.Cmd.stop cmd
        true
    end
  end
  def stop(id), do: stop(Serverboards.Plugin.Runner, id)


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
    GenServer.call(runner, {:method_caller})
  end
  def method_caller do
    method_caller(Serverboards.Plugin.Runner)
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

  """
  def call(runner, id, method, params) when (is_pid(runner) or is_atom(runner)) and is_binary(id) and is_binary(method) do
    case GenServer.call(runner, {:get, id}) do
      :not_found ->
        Logger.error("Could not find plugin id #{inspect id}: :not_found")
        {:error, :unknown_method}
      cmd when is_pid(cmd) ->
        Serverboards.IO.Cmd.call cmd, method, params
    end
  end
  def call(id, method, params \\ []) do
    Logger.info("Calling #{id}.#{method}(#{inspect params})")
    call(Serverboards.Plugin.Runner, id, method, params)
  end


  ## server impl
  def init :ok do
    Logger.info("Plugin runner ready #{inspect self}")

    {:ok, method_caller} = Serverboards.Plugin.RPC.start_link(self)

    {:ok, %{
      method_caller: method_caller,
      running: %{}
      }}
  end

  def handle_call({:start, id, cmd}, _from, state) do
    Logger.debug("Adding runner :start")
    {:reply, :ok,
      %{ state | running: Map.put(state.running, id, cmd) }
    }
  end
  def handle_call({:pop, id}, _from, state) do
    {cmd, running} = Map.pop(state.running, id, nil)
    state = %{ state | running: running }
    if cmd do
      {:reply, {:ok, cmd}, state }
    else
      {:reply, {:error, :not_running}, state }
    end
  end
  def handle_call({:method_caller}, _from, state) do
    {:reply, state.method_caller, state}
  end
  def handle_call({:get, id}, _from, state) do
    {:reply, Map.get(state.running, id, :not_found), state}
  end
end
