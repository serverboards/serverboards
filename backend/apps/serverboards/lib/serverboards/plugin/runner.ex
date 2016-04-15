require Logger

defmodule Serverboards.Plugin.Runner do
  @moduledoc ~S"""
  Server that stats plugins and connects the RPC channels.
  """
  use GenServer
  alias Serverboards.MOM.RPC.MethodCaller
  alias Serverboards.Plugin


  def start_link (options \\ []) do
    GenServer.start_link __MODULE__, :ok, options
  end

  @doc ~S"""
  Starts a component by name and adds it to the runnign registry.

  Example:

    iex> {:ok, cmd} = start("serverboards.test.auth/auth.test")
    iex> Serverboards.IO.Cmd.call cmd, "ping"
    "pong"
    iex> stop("serverboards.test.auth/auth.test")
    :ok

  Or if does not exist:

    iex> start("nonexistantplugin")
    {:error, :not_found}

  """
  def start(runner, plugin_component_id) do
    case Plugin.Component.run plugin_component_id do
      {:ok, cmd } ->
        :ok = GenServer.call(runner, {:start, plugin_component_id, cmd})
        {:ok, cmd}
      {:error, e} ->
        Logger.error("Error starting plugin component #{inspect plugin_component_id}")
        {:error, e}
    end
  end
  def start(plugin_component_id), do: start(Serverboards.Plugin.Runner, plugin_component_id)

  def stop(runner, id) do
    case GenServer.call(runner, {:stop, id}) do # stop is almost a pop, so that cliet works more
      {:error, e} ->
        Logger.error("Error stoping component #{inspect e}")
        {:error, e}
      {:ok, cmd} ->
        Serverboards.IO.Cmd.stop cmd
        :ok
    end
  end
  def stop(id), do: stop(Serverboards.Plugin.Runner, id)

  ## server impl
  def init :ok do
    Logger.info("Plugin runner ready #{inspect self}")

    {:ok, method_caller} = MethodCaller.start_link

    MethodCaller.add_method method_caller, "plugin.start", fn plugin_component_id ->
      Plugin.Runner.start self, plugin_component_id
    end

    MethodCaller.add_method method_caller, "plugin.stop", fn plugin_component_id ->
      Plugin.Runner.stop self, plugin_component_id
    end

    {:ok, %{
      method_caller: method_caller,
      running: %{}
      }}
  end

  def handle_call({:start, id, cmd}, _from, state) do
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
end
