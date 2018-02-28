require Logger

defmodule Serverboards.Utils.Cache do
  use GenServer

  def start_link(options \\ []) do
    GenServer.start_link(__MODULE__, nil, options)
  end

  def get(id, f, options) do
    case Process.whereis(__MODULE__) do
      nil ->
        f.() # not running, just dont cache
      pid ->
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
  end

  # Make the server ask for the data
  defp get_at_genserver(id, f, options) do
    val = GenServer.call(__MODULE__, {:get, id, f}, 60_000)

    if val == :youdoit do # this marks I must do it, and then send the value for the rest.
      val = try do
        f.()
      catch
        :exit, _ ->
          {:error, :exit}
        any, any ->
          {:error, {any, any}}
      rescue
        error ->
          {:error, error}
      end
      if val != {:error, :exit} do
        GenServer.cast(__MODULE__, {:insert, id, val})

        case options[:ttl] do
          nil -> :ok
          ttl ->
            Process.send_after(__MODULE__, {:remove, id, :timeout}, ttl)
        end
      else # reply error, but dont cache it
        GenServer.cast(__MODULE__, {:remove, id, :exit})
      end
      val
    else val end
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
        prev_from = Map.get(status,id, nil)
        if prev_from == nil do # the first calculates the value
          status = Map.put(status, id, [] )
          # Logger.debug("No answer, you do it #{inspect status}")
          {:reply, :youdoit, status}
        else
          # Logger.debug("No anwser, wait for it #{inspect status}")
          status = Map.put(status, id, [from | prev_from] )
          {:noreply, status}
        end
    end
  end

  def handle_info({:remove, id, error}, status), do: handle_cast({:remove, id, error}, status)

  def handle_cast({:remove, id, error}, status) do
    :ets.delete(__MODULE__, id)
    # Logger.debug("Got answer for #{inspect id} -> #{inspect value}: #{inspect status[id]}")
    Enum.map(Map.get(status, id, []), fn from ->
      GenServer.reply(from, {:error, error})
    end)
    status = Map.drop(status, [id])
    {:noreply, status}
  end
  def handle_cast({:insert, id, value}, status) do
    :ets.insert(__MODULE__, {id, value})

    # Logger.debug("Got answer for #{inspect id} -> #{inspect value}: #{inspect status[id]}")
    Enum.map(status[id], fn from ->
      GenServer.reply(from, value)
    end)
    status = Map.drop(status, [id])
    {:noreply, status}
  end
end
