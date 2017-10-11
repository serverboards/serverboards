require Logger

defmodule Serverboards.Utils.MonitorCallbacks do
  use GenServer

  def start_link(options \\ []) do
      GenServer.start_link __MODULE__, [], [name: __MODULE__] ++ options
  end

  def monitor(pid, callback) do
    GenServer.cast(__MODULE__, {:monitor, pid, callback})
  end

  def init([]) do
    {:ok, %{}}
  end

  def handle_cast({:monitor, pid, callback}, state) do
    # Logger.debug("Want to monitor #{inspect pid}, when dead, call #{inspect callback}")

    updated_callbacks = Map.get(state, pid, []) ++ [callback]
    Process.monitor(pid)

    {:noreply,
      Map.put(state, pid, updated_callbacks)
    }
  end

  def handle_info({:DOWN, _ref, :process, pid, reason}, state) do
    for func <- Map.get(state, pid, []) do
      try do
        func.()
      rescue _ ->
        Logger.error("Error calling the monitor down fn #{inspect func}")
      end
    end
    {:noreply, Map.drop(state, [pid])}
  end
  def handle_info(data, state) do
    Logger.debug("Got unknown info #{inspect data}")
    {:noreply, state}
  end
end
