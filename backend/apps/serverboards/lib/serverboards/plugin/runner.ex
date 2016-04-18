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
  alias Serverboards.MOM.RPC.MethodCaller
  alias Serverboards.Plugin


  def start_link (options \\ []) do
    {:ok, pid} = GenServer.start_link __MODULE__, :ok, options

    Serverboards.MOM.Channel.subscribe(:auth_authenticated, fn msg ->
      %{ user: user, client: client} = msg.payload
      if Enum.member?(user.perms, "plugin") do
        import Serverboards.MOM.RPC
        add_method_caller client.to_serverboards, Serverboards.Plugin.Runner.method_caller
      end
    end)

    {:ok, pid}
  end

  @doc ~S"""
  Starts a component by name and adds it to the runnign registry.

  Example:

    iex> {:ok, cmd} = start("serverboards.test.auth/auth.test")
    iex> call cmd, "ping"
    "pong"
    iex> stop(cmd)
    true

  Or if does not exist:

    iex> start("nonexistantplugin")
    {:error, :not_found}

  """
  def start(runner, plugin_component_id) when is_pid(runner) or is_atom(runner) do
    case Plugin.Component.run plugin_component_id do
      {:ok, cmd } ->
        require UUID
        uuid = UUID.uuid4
        Logger.debug("Adding runner #{uuid} #{inspect cmd} to #{inspect runner}")
        :ok = GenServer.call(runner, {:start, uuid, cmd})
        {:ok, uuid}
      {:error, e} ->
        Logger.error("Error starting plugin component #{inspect plugin_component_id}")
        {:error, e}
    end
  end
  def start(plugin_component_id), do: start(Serverboards.Plugin.Runner, plugin_component_id)

  def stop(runner, id) do
    case GenServer.call(runner, {:stop, id}) do # stop is almost a pop, so that caller works more then runner server
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

    iex> pl = Serverboards.MOM.RPC.MethodCaller.call method_caller, "plugin.start", ["serverboards.test.auth/auth.test"]
    iex> is_binary(pl)
    true
    iex> Serverboards.MOM.RPC.MethodCaller.call method_caller, "plugin.call", [pl, "ping",[]]
    "pong"
    iex> Serverboards.MOM.RPC.MethodCaller.call method_caller, "plugin.call", [pl, "ping"] # default [] params
    "pong"
    iex> Serverboards.MOM.RPC.MethodCaller.call method_caller, "plugin.stop", [pl]
    true

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

    iex> {:ok, cmd} = start "serverboards.test.auth/auth.test"
    iex> call cmd, "ping"
    "pong"
    iex> call cmd, "unknown"
    ** (Serverboards.MOM.RPC.UnknownMethod) Unknown method "unknown"
    iex> stop cmd
    true

  If passing and unknown or already stopped cmdid

    iex> call "nonvalid", "ping"
    {:error, :unknown_cmd}

    iex> {:ok, cmd} = start "serverboards.test.auth/auth.test"
    iex> stop cmd
    iex> call cmd, "ping"
    {:error, :unknown_cmd}

  """
  def call(runner, id, method, params) when (is_pid(runner) or is_atom(runner)) and is_binary(id) and is_binary(method) do
    case GenServer.call(runner, {:get, id}) do
      {:error, e} ->
        {:error, e}
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

    {:ok, method_caller} = MethodCaller.start_link
    runner=self

    MethodCaller.add_method method_caller, "plugin.start", fn [plugin_component_id] ->
      case Plugin.Runner.start runner, plugin_component_id do
        {:ok, id} -> id
        {:error, e} -> {:error, e}
      end
    end

    MethodCaller.add_method method_caller, "plugin.stop", fn [plugin_component_id] ->
      Plugin.Runner.stop runner, plugin_component_id
    end

    MethodCaller.add_method method_caller, "plugin.call", fn
      [id, method, params] ->
        Plugin.Runner.call runner, id, method, params
      [id, method] ->
        Plugin.Runner.call runner, id, method, []
    end

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
  def handle_call({:stop, id}, _from, state) do
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
    {:reply, Map.get(state.running, id, {:error, :unknown_cmd}), state}
  end
end
