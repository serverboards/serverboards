require Logger

defmodule Serverboards.Utils.Cache do
  use GenServer

  def start_link(options \\ []) do
    GenServer.start_link(__MODULE__, nil, options)
  end

  def hash(data) do
    :crypto.hash(:sha, inspect data) |> Base.encode16
  end

  def get(id, f, options) do
    id = hash(id)
    case Process.whereis(__MODULE__) do
      nil ->
        f.() # not running, just dont cache
      pid ->
        # Logger.debug("Get #{inspect id}")
        case :ets.lookup(__MODULE__, id) do
          [{^id, :running}] ->
            get_at_genserver(id, f, options)
          [{^id, value}] ->
            # Logger.debug("From cache #{inspect {id, value}}")
            value
          other ->
            get_at_genserver(id, f, options)
        end
    end
  end

  def remove(id) do
    id = hash(id)
    Logger.debug("Remove #{inspect id}")
    case Process.whereis(__MODULE__) do
      nil ->
        :ok
      pid ->
        GenServer.call(pid, {:remove, id})
    end
  end

  # Make the server ask for the data
  defp get_at_genserver(id, f, options) do
    val = try do
      GenServer.call(__MODULE__, {:get, id, f}, Keyword.get(options, :ttl, 5_000))
    catch
      :exit, {:timeout, where} ->
        Logger.error("Timeout getting data for cache. #{inspect id}.")
        Logger.debug("Somebody else asked for the data, and did not answer in 5 sec.")
        # If there are more, mark them as timeouted too
        GenServer.cast(__MODULE__, {:remove, id, :exit})
        {:error, :exit}
    end

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
        GenServer.cast(__MODULE__, {:remove, id, val})
      end
      val
    else
      val
    end
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
          # Logger.debug("No answer, you do it #{inspect id} #{inspect status}")
          {:reply, :youdoit, status}
        else
          # Logger.debug("No anwser, wait for it #{inspect status[id]}")
          status = Map.put(status, id, [from | prev_from] )
          {:noreply, status}
        end
    end
  end

  def handle_call({:remove, id}, _from, status) do
    {:noreply, status} = handle_cast({:remove, id, :removed}, status)
    {:reply, :ok, status}
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

    # Logger.debug("Got answer for #{inspect id}: #{inspect status[id]}")
    Enum.map(status[id], fn from ->
      GenServer.reply(from, value)
    end)
    status = Map.drop(status, [id])
    {:noreply, status}
  end
end
