require Logger

defmodule Serverboards.ProcessRegistry do
  @moduledoc """
  Simple registry of pids by and Id.

  It monitors the pid, so if it exits, it removes the pid from the registry

  Use for example at Rules to track running rules.
  """
  use GenServer

  def start_link(options \\ []) do
    GenServer.start_link(__MODULE__, [], options)
  end

  def stop(registry, reason \\ :normal) do
    GenServer.stop(registry, reason)
  end

  def add(registry, id, pid) when is_pid(pid) do
    GenServer.call(registry, {:add, id, pid})
  end

  def get(registry, id) do
    GenServer.call(registry, {:get, id})
  end

  def pop(registry, id) do
    GenServer.call(registry, {:pop, id})
  end

  def list(registry) do
    GenServer.call(registry, {:list})
  end

  def init([]) do
    {:ok, %{}}
  end

  def handle_call({:add, id, pid}, _from, state) do
    Process.monitor(pid)
    {:reply, :ok, Map.put(state, id, pid)}
  end

  def handle_call({:get, id}, _from, state) do
    {:reply, Map.get(state, id), state}
  end

  def handle_call({:pop, id}, _from, state) do
    pid = Map.get(state, id)
    {:reply, pid, Map.drop(state, [id])}
  end

  def handle_call({:list}, _from, state) do
    {:reply, state, state}
  end

  def handle_info({:DOWN, _ref, :process, pid, _reason}, state) do
    # Logger.debug("#{inspect pid} is down, deregister")
    state =
      case Enum.find(state, fn {_key, val} -> val == pid end) do
        {k, _v} ->
          Map.drop(state, [k])

        nil ->
          state
      end

    {:noreply, state}
  end
end
