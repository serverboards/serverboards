require Logger

alias Serverboards.Logger.Model
alias Serverboards.Repo

defmodule Serverboards.Logger.Server do
  @moduledoc ~S"""
  Real logger to database; it has a queue and ensures data is properly saved
  without delaying the logger calls.
  """
  @behaviour :gen_server

  @max_queue_size 100

  def start_link(options \\ []) do
    GenServer.start_link __MODULE__, [], options
  end
  def log(lg, msg) do
    GenServer.cast(lg, {:log, msg})
    :ok
  end
  def flush(lg) do
    GenServer.call(lg, :flush)
    :ok
  end

  def to_json_type(v) do
    case v do
      s when is_binary(s) -> s
      n when is_number(n) -> n
      m when is_map(m) -> Map.new(for {k,v} <- Map.to_list(m), do: {k, to_json_type(v)})
      l when is_list(l) -> for el <- l, do: to_json_type(el)
      t when is_tuple(t) -> to_json_type(Tuple.to_list t)
      o -> inspect(o)
    end
  end

  # server impl
  def init([]) do
    Process.send_after(__MODULE__, {:cleanup, "debug"}, 5000)
    Process.send_after(__MODULE__, {:cleanup, "info"}, 15000)
    Process.send_after(__MODULE__, {:cleanup, "error"}, 25000)
    # cleanup(:info)
    # cleanup(:error)

    {:ok, %{ count: 0, queue: [], timer: nil}}
  end

  def cleanup(level) do
    import Ecto.Query

    timeout = Serverboards.Config.get(:logs, "cleanup_#{level}_maxdays", 3)
    if timeout > 0 do
      maxtimestamp = DateTime.utc_now() |> Timex.shift(days: -timeout)

      query = (from l in Model.Line,
              where: l.timestamp <= ^maxtimestamp and l.level == ^level)
      count = query |> Repo.aggregate(:count, :id)
      Logger.debug("Cleanup #{level} logs before #{inspect maxtimestamp}. #{timeout} days ago. #{count} lines.")
      # IO.puts(inspect Ecto.Adapters.SQL.to_sql(:all, Repo, query))
      Repo.delete_all(query)
      # vacuum. Reclaim disk space from the log deleting.
      if Serverboards.Config.get(:logs, "vacuum_after_cleanup", true) do
        Task.start(fn ->
          Ecto.Adapters.SQL.query!(Repo, "VACUUM", [])
        end)
      end
    end
  end

  def handle_cast({:log, msg}, state) do
    state = %{ state | count: state.count+1, queue: [msg | state.queue] }
    state = try do
      if state.count >= @max_queue_size do
        {_reply, _, state} = handle_call(:flush, nil, state)
        state
      else
        state
      end
    catch
      a ->
        IO.puts("Error flushing log to db: #{inspect a}")
      a, b ->
        IO.puts("Error flushing log to db: #{inspect a} // #{inspect b}")
    end

    if state.timer do
      :timer.cancel(state.timer)
    end
    {:ok, timer} = :timer.apply_after(1000, __MODULE__, :flush, [__MODULE__])
    state = %{ state | timer: timer }

    {:noreply, state}
  end

  def handle_call(:flush, _from, state) do
    if state.timer do
      :timer.cancel(state.timer)
    end

    entries = for {message, timestamp, metadata, level} <- Enum.reverse(state.queue) do
      {ymd, {h,m,s, _}} = timestamp
      timestamp = {ymd, {h,m,s}}
      timestamp = NaiveDateTime.from_erl!(timestamp)
      timestamp = DateTime.from_naive!(timestamp, "Etc/UTC")

      %{
        message: to_string(message),
        level: to_string(level),
        timestamp: timestamp,
        meta: Map.new(metadata, fn {k,v} -> {k, to_json_type v} end)
        }
    end
    try do
      Repo.insert_all(Model.Line, entries)
    catch
      :exit, reason ->
        IO.puts("Error storing log line: #{inspect reason} (maybe not ready yet)")
    end

    {:reply, state.count, %{ count: 0, queue: [], timer: nil}}
  end

  def handle_info({:cleanup, level}, state) do
    # clean
    cleanup(level)
    # and rearm for tomorrow, same time
    Process.send_after(__MODULE__, {:cleanup, level}, 24 * 60 * 60 * 1000)

    {:noreply, state}
  end

  @doc false
  def terminate(_reason, _state) do
    :ok
  end
end
