require Logger

defmodule Serverboards.Plugin.Init do
  use GenServer

  defstruct [
    id: nil,
    name: nil,
    description: nil,
    command: nil,
    call: nil
  ]

  @max_timeout 60*60*2 # 2h

  def start_link(init, options \\ []) do
    GenServer.start_link(__MODULE__, init, options)
  end

  def stop(init) do
    GenServer.stop(init)
  end

  def from_component(c) do
    command = case String.split(c.extra["command"], "/") do
      [component_id] ->
        [plugin_id, _] = String.split(c.id, "/")
        "#{plugin_id}/#{component_id}"
      [plugin_id, component_id] ->
        "#{plugin_id}/#{component_id}"
    end

    %Serverboards.Plugin.Init{
      id: c.id,
      name: c.name,
      description: c.description,
      command: command,
      call: c.extra["call"]
    }
  end


  ## impl
  def init(init) do
    state = %{
      running: false,
      init: init,
      task: nil,
      timeout: 1,
      timer: nil,
      started_at: nil,
      cmd: nil
    }

    GenServer.cast(self(),{:start})

    {:ok, state}
  end

  def terminate(reason, state) do
    Serverboards.Plugin.Runner.stop(state.cmd)
    Logger.info("Terminated init #{ state.init.id } #{inspect reason}", init: state.init)
    :shutdown
  end

  def handle_cast({:start}, state) do
    Logger.info("Starting init service #{inspect state.init.id}", init: state.init)
    init = state.init
    {:ok, cmd} = Serverboards.Plugin.Runner.start(init.command, "system/init")
    Process.monitor((Serverboards.Plugin.Runner.get cmd).pid)
    #Process.link((Serverboards.Plugin.Runner.get cmd).pid)
    task =  Task.async(Serverboards.Plugin.Runner, :call, [cmd, init.call, []])

    state = %{
      state |
      cmd: cmd,
      running: true,
      task: task,
      started_at: Timex.Duration.now()
    }

    #Logger.debug("It should be running: #{inspect task}, #{inspect state}")

    {:noreply, state}
  end

  defp handle_wait_run(%{started_at: started_at, timeout: timeout } = state) do
    running_for_seconds = -Timex.Duration.diff(started_at, nil, :seconds)
    timeout = max(1, min((timeout - running_for_seconds) * 2, @max_timeout)) # 2h
    timer = Process.send_after(self(), {:restart}, timeout * 1000)
    state = %{
      state |
      timeout: timeout,
      timer: timer,
      started_at: nil,
      task: nil
    }
    Logger.info("Restart init #{state.init.id} in #{state.timeout} seconds.", state: state)
    state
  end

  def handle_info({:DOWN, _ref, :process, _pid, type}, %{started_at: started_at} = state) when is_nil(started_at) do
    # this is when already finished properly, it may close the cmd.
    #Logger.info("Init \"#{inspect state.init.id}\" down (#{inspect type}).")
    Serverboards.Plugin.Runner.stop(state.cmd)
    {:noreply, state}
  end
  def handle_info({:DOWN, ref, :process, pid, type}, state) do
    #Logger.info("Init \"#{inspect state.init.id}\" down (#{inspect type}).")
    Serverboards.Plugin.Runner.stop(state.cmd)
    state = handle_wait_run(state)
    {:noreply, state}
  end
  def handle_info({:restart}, state) do
    Serverboards.Plugin.Runner.stop(state.cmd)
    handle_cast({:start}, state)
  end
  def handle_info({_ref, {:error, :unknown_method}}, state) do
    Logger.error("Cant run init, unknown method #{inspect state.init.call}")
    state = handle_wait_run(state)
    {:noreply, state}
  end
  def handle_info({_ref, {:error, error}}, state) do
    Logger.error("Error running init #{inspect state.init.id}, error: #{inspect error}.", init: state.init, error: error)
    state = handle_wait_run(state)
    {:noreply, state}
  end
  def handle_info({_ref, {:ok, waits}}, state) when is_number(waits) do
    %{started_at: started_at } = state
    running_for_seconds = -Timex.Duration.diff(started_at, nil, :seconds)
    timeout = max(1, waits)
    timer = Process.send_after(self(), {:restart}, timeout * 1000)
    state = %{
      state |
      timeout: timeout,
      timer: timer,
      started_at: nil,
      task: nil
    }
    Logger.info("Init \"#{state.init.id}\" finished properly. Did run for #{running_for_seconds} seconds. Restart in #{state.timeout} seconds.", state: state)
    {:noreply, state}
  end
  def handle_info({:EXIT, _from, :normal}, state) do
    Logger.debug("Stop the external process #{inspect state}")
    Serverboards.Plugin.Runner.stop(state.cmd)
    {:stop, :normal, state}
  end
  def handle_info({:EXIT, _from, :force_stop}, state) do
    Logger.info("Kill the external process #{inspect state.init.command}")
    Serverboards.Plugin.Runner.kill(state.cmd)
    {:stop, :normal, state}
  end
  def handle_info(any, state) do
    Logger.warn("#{inspect self} Got info: #{inspect any}")
    {:noreply, state}
  end
end
