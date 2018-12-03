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
      init: init,
      task: nil,
      timeout: 1,
      timer: nil,
      started_at: nil,
      ignore_down: false # ignore one down, do not dup first timeout
    }

    GenServer.cast(self(),{:start})

    {:ok, state}
  end

  def terminate(reason, state) do
    # Serverboards.Plugin.Runner.stop(state.cmd)
    Logger.info("Terminated init #{ state.init.id } #{inspect reason}", init: state.init)
    :shutdown
  end

  def handle_cast({:start}, state) do
    Logger.info("Starting init service #{inspect state.init.id}", init: state.init)
    init = state.init
    task =  Task.async(Serverboards.Plugin.Runner, :call, [init.command, init.call, []])

    state = %{
      state |
      task: task,
      started_at: Timex.Duration.now()
    }

    #Logger.debug("It should be running: #{inspect task}, #{inspect state}")

    {:noreply, state}
  end

  defp handle_wait_run(%{started_at: started_at, timeout: timeout, ignore_down: ignore_down } = state) do
    # There has been an error (process or method failed), so we retry to call it
    # again after some time, that depends on how long it was running.
    if state.timer do # if inside timer, do not retrigger. Just set a new timer.
      running_for_seconds = case started_at do
        nil -> 0
        _other -> -Timex.Duration.diff(started_at, nil, :seconds)
      end

      Process.cancel_timer(state.timer)
      timer = Process.send_after(self(), {:restart}, timeout * 1000)

      # Timeout is for next run
      timeout = if ignore_down do
        timeout
      else
        max(1, min((timeout - running_for_seconds) * 2, @max_timeout)) # 2h
      end
      state = %{
        state |
        timeout: timeout,
        timer: timer,
        started_at: nil,
        task: nil,
        ignore_down: false,
      }
      Logger.info("Restart init #{inspect state.init.id} in #{state.timeout} seconds.", state: state)
      state
    else
      state
    end
  end

  def handle_info({:DOWN, _ref, :process, _pid, _type}, state) do
    # Logger.info("Init \"#{inspect state.init.id}\" down (#{inspect type}).")
    state = handle_wait_run(state)
    {:noreply, state}
  end
  def handle_info({:restart}, state) do
    if state.timer do
      Process.cancel_timer(state.timer)
    end
    state = %{
      state |
      timer: nil
    }
    # FIXED on restart may timeout, cast should never timeout
    GenServer.cast(self(),{:start})
    {:noreply, state}
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
    running_for_seconds = if started_at do
      -Timex.Duration.diff(started_at, nil, :seconds)
    else nil end

    timeout = max(1, waits)
    if state.timer do
      Process.cancel_timer(state.timer)
    end
    timer = Process.send_after(self(), {:restart}, timeout * 1000)
    state = %{
      state |
      ignore_down: true,
      timeout: timeout,
      timer: timer,
      started_at: nil,
      task: nil
    }
    Logger.info(
      "Init \"#{state.init.id}\" finished properly. Did run for #{inspect running_for_seconds} seconds. " <>
      "Restart in #{inspect timeout} secs.")
    {:noreply, state}
  end
  def handle_info({ref, {:ok, nil}}, state) do
    handle_info({ref, {:ok, 10*60*60}}, state)
  end
  def handle_info(any, state) do
    Logger.warn("Got info: #{inspect any}")
    {:noreply, state}
  end
end
