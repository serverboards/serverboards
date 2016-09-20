require Logger

defmodule Serverboards.Plugin.Monitor do
  @moduledoc ~S"""
  Monitors changes in the plugins and reloads the registry if necesary.
  """
  use GenServer

  @timeout 5000 # batch changes to until no changes in 1s

  def start_link(options \\ []) do
    dirnames = Application.fetch_env! :serverboards, :plugin_paths
    GenServer.start_link __MODULE__, dirnames, options
  end


  # server
  def init(dirnames) do
    Process.flag(:trap_exit, true)

    cmd = "/usr/bin/inotifywait"
    args = ~w(-q -c -m -e close_write -e moved_to -e create -e delete -e attrib --exclude node_modules --exclude ".*~" -r)
    args = args ++ dirnames
    cmdopts = [:stream, :line, :use_stdio, args: args]
    port = Port.open({:spawn_executable, cmd}, cmdopts)
    Port.connect(port, self)

    Logger.warn("Plugin monitor ready! #{inspect port} #{inspect cmdopts}")

    {:ok, %{ port: port, dirnames: dirnames, expect_exit: false, timeout: :none }}
  end

  def handle_info({port, {:data,{:eol, data}}}, state) do
    [_, dirname, _actions, filename] = Regex.run(~r/^([^,]*),(.*),([^,]*)$/, List.to_string(data))
    file_path = "#{dirname}#{filename}"
    Logger.debug("Changes at #{file_path}")

    if state.timeout != :none do
      :timer.cancel(state.timeout)
    end

    {:ok, timeout} = :timer.send_after(@timeout, :reload_plugins)

    {:noreply, %{ state | timeout: timeout }}
  end

  def handle_info(:reload_plugins, state) do
    Logger.info("Detected plugin change. Reloading plugin data.")
    Serverboards.Plugin.Registry.reload_plugins(Serverboards.Plugin.Registry)
    {:noreply, %{state | timeout: :none}}
  end

  def handle_info({:EXIT, port, :normal}, state) do
    if not state.expect_exit do
      Logger.error("Unexpected inotifywait exit. Check max inotifywait is installed and /proc/sys/fs/inotify/max_user_watches is properly configured")
    end
    {:stop, :normal, state}
  end

  def handle_info(any, state) do
    Logger.debug(inspect any)
    {:noreply, state}
  end

  def terminate(reason, state) do
    Logger.debug("Terminate plugin monitor #{inspect state.port}")
    Serverboards.IO.Cmd.kill(state.port)
    {:ok}
  end
end
