require Logger

defmodule Serverboards.Plugin.Monitor do
  @moduledoc ~S"""
  Monitors changes in the plugins and reloads the registry if necesary.
  """
  use GenServer

  @timeout 5000 # batch changes to until no changes in 1s

  def start_link(options \\ []) do
    paths = Application.fetch_env! :serverboards, :plugin_paths
    paths = paths ++ [Path.join(Serverboards.Config.serverboards_path, "plugins")]
    GenServer.start_link __MODULE__, paths, options
  end


  defp subdirs(dirname) do
    case File.ls(dirname) do
      {:ok, files} ->
        files
          |> Enum.map(&Path.join(dirname,&1))
          |> Enum.filter(&File.dir?(&1))
      {:error, error} ->
        Logger.error("Plugin directory #{dirname} error: #{inspect error}")
        []
    end
  end

  # server
  def init(dirnames) do
    Process.flag(:trap_exit, true)

    cmd = "/usr/bin/inotifywait"
    args = ~w(-q -c -m -e close_write -e moved_to -e create -e delete -e attrib )
    all_subdirs = dirnames |> Enum.flat_map(&subdirs(&1))
    args = args ++ dirnames ++ all_subdirs
    cmdopts = [:stream, :line, :use_stdio, args: args]
    port = Port.open({:spawn_executable, cmd}, cmdopts)
    Port.connect(port, self)

    Logger.info("Plugin monitor ready! #{inspect port} #{inspect(dirnames++all_subdirs)}")

    {:ok, %{ port: port, dirnames: dirnames, expect_exit: false, timeout: :none }}
  end
  def terminate(_, state) do
    Logger.debug("Terminating inotify watcher")
    Serverboards.IO.Cmd.kill(state.port)
  end

  def handle_info({_port, {:data,{:eol, data}}}, state) do
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
    Serverboards.Plugin.Registry.reload_plugins()
    {:noreply, %{state | timeout: :none}}
  end

  def handle_info({:EXIT, _port, :normal}, state) do
    if not state.expect_exit do
      Logger.error("Unexpected inotifywait exit. Check max inotifywait is installed and /proc/sys/fs/inotify/max_user_watches is properly configured")
    end
    {:stop, :normal, state}
  end

  def handle_info(any, state) do
    Logger.debug(inspect any)
    {:noreply, state}
  end

  def terminate(_reason, state) do
    Logger.debug("Terminate plugin monitor #{inspect state.port}")
    Serverboards.IO.Cmd.kill(state.port)
    {:ok}
  end
end
