require Logger

defmodule Serverboards.Query.Cache do
  use GenServer

  def start_link(options \\ []) do
    GenServer.start_link(__MODULE__, nil, options)
  end

  def get(id, f, options) do
    # Logger.debug("Get #{inspect id}")
    case :ets.lookup(__MODULE__, id) do
      [{^id, value}] ->
        value
      other ->
        val = GenServer.call(__MODULE__, {:insert, id, f})
        case options[:ttl] do
          nil -> :ok
          ttl ->
            Process.send_after(__MODULE__, {:remove, id}, ttl)
        end
        val
    end
  end

  ## impl

  def init(nil) do
    :ets.new(__MODULE__, [:named_table])
    {:ok, :ok}
  end

  def handle_call({:insert, id, f}, _from, status) do
    # try get again, as several calls may have been queued
    val = case :ets.lookup(__MODULE__, id) do
      [{^id, value}] ->
        value
      _other ->
        # Logger.debug("Calculate value for #{inspect id}")
        value = f.()
        :ets.insert(__MODULE__, {id, value})
        value
    end
    {:reply, val, status}
  end

  def handle_info({:remove, id}, status) do
    :ets.delete(__MODULE__, id)
    {:noreply, status}
  end
end
