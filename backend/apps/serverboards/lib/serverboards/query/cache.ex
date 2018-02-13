require Logger

defmodule Serverboards.Query.Cache do
  use GenServer

  def start_link(options \\ []) do
    GenServer.start_link(__MODULE__, nil, options)
  end

  def get(id, f, options) do
    # Logger.debug("Get #{inspect id}")
    case :ets.lookup(__MODULE__, id) do
      [{^id, :running}] ->
        get_at_genserver(id, f, options)
      [{^id, value}] ->
        value
      other ->
        get_at_genserver(id, f, options)
    end
  end

  # Make the server ask for the data
  defp get_at_genserver(id, f, options) do
    val = GenServer.call(__MODULE__, {:get, id, f}, 60_000)
    case options[:ttl] do
      nil -> :ok
      ttl ->
        Process.send_after(__MODULE__, {:remove, id}, ttl)
    end
    val
  end

  ## impl

  def init(nil) do
    :ets.new(__MODULE__, [:named_table])

    # status is a map of {id, f} to queue of requesters
    {:ok, %{}}
  end

  def calculate_and_add(id, f) do
    value = f.()
  end

  def handle_call({:get, id, f}, from, status) do
    case :ets.lookup(__MODULE__, id) do
      [{^id, value}] ->
        {:reply, value, status}
      _ ->
        # try get again, as several calls may have been queued
        prev_from = Map.get(status,id, [])
        if prev_from == [] do # the first calculates the value
          Task.start_link(fn ->
            value = f.()
            GenServer.cast(__MODULE__, {:insert, id, value})
          end)
        end
        status = Map.put(status, id, [from | prev_from] )
        {:noreply, status}
    end
  end

  def handle_info({:remove, id}, status) do
    :ets.delete(__MODULE__, id)
    {:noreply, status}
  end
  def handle_cast({:insert, id, value}, status) do
    :ets.insert(__MODULE__, {id, value})

    Enum.map(status[id], fn from ->
      GenServer.reply(from, value)
    end)
    status = Map.drop(status, [id])
    {:noreply, status}
  end
end
