require Logger
alias Serverboards.Logger.Model
alias Serverboards.Repo

defmodule Serverboards.Logger do
  @moduledoc ~S"""
  Stores log messages into the database.

  It has some care not to store database messages, as they can generate new
  log events.

    * Uses a queue in state and flush it at :flush. This should increase throughput
    * First message may fail because database is not ready yet.
  """
  use GenEvent

  @doc ~S"""
  Returns a list of mesages, it can receive a filter

  * start -- maximum id to show (not included). Used for paging
  * count -- how many messages to show
  """
  def history(options \\ %{}) do
    import Ecto.Query

    # Prepare the main query
    q = from l in Model.Line
    q = case options[:service] do
      nil -> q
      id -> where(q, [l],
        fragment("?->>'service' = ?", l.meta, ^id)
        or
        fragment("?->>'service_id' = ?", l.meta, ^id)
        )
    end
    q = case options[:q] do
      nil -> q
      query -> where(q, [l],
        fragment("to_tsvector('english', ? || ?::text) @@ to_tsquery('english',?)", l.message, l.meta, ^to_tsquery(query))
        )
    end

    # count total lines
    qcount = select(q, [l], count(l.id))
    count = Repo.one( qcount )

    # get the lines, current window
    qlines = q
      |> select([l], %{ message: l.message, timestamp: l.timestamp, level: l.level, meta: l.meta, id: l.id})
      |> limit(^Map.get(options, :count, 50))
      |> order_by([l], [desc: l.id]);
    qlines = case options[:start] do
      nil -> qlines
      id -> where(qlines, [l], l.id < ^id )
    end
    qlines = case options[:offset] do
      nil -> qlines
      offs -> qlines |> offset(^offs)
    end
    lines = Repo.all(qlines)


    {:ok, %{ lines: lines, count: count }}
  end

  defp to_tsquery(txt) do
    txt
      |> String.split(" ", trim: true)
      |> Enum.join(" & ")
  end

  defp should_log?(metadata, level) do
    cond do
      level == :debug -> false
      metadata[:application] == :ecto -> false
      true -> true
    end
  end

  # implementation of Logger.log

  def ignore_applications do
    [ :ecto ]
  end

  def init(_opts) do
    children = [
      Supervisor.Spec.worker(Serverboards.Logger.Server, [[name: Serverboards.Logger.Server]])
    ]
    {:ok, supervisor} = Supervisor.start_link(children, strategy: :one_for_one)

    {:ok, %{ ignore_applications: ignore_applications, queue: [], supervisor: supervisor }}
  end

  def handle_event(:flush, state) do
    Serverboards.Logger.Server.flush(Serverboards.Logger.Server)
    {:ok, state}
  end
  # ignore if im not group leader
  def handle_event({_level, gl, {Logger, _, _, _}}, state)
      when node(gl) != node() do
    {:ok, state}
  end
  def handle_event({level, _group_leader, {Logger, message, timestamp, metadata}}, state) do
    if should_log?(metadata, level) do
      Serverboards.Logger.Server.log(Serverboards.Logger.Server, {message, timestamp, metadata, level})
    end
    {:ok, state}
  end
  def handle_event({:configure, opts}, _state) do
    IO.puts("Logs configure: #{inspect opts}")
  end
end

defmodule Serverboards.Logger.Server do
  @moduledoc ~S"""
  Real logger to database; it has a queue and ensures data is properly saved
  without delaying the logger calls.
  """
  use GenServer

  @max_queue_size 100

  def start_link(options \\ []) do
    GenServer.start_link __MODULE__, [], options
  end
  def log(lg, msg) do
    GenServer.call(lg, {:log, msg})
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
    {:ok, %{ count: 0, queue: [], timer: nil}}
  end

  def handle_call({:log, msg}, from, state) do
    state = %{ state | count: state.count+1, queue: [msg | state.queue] }
    state = try do
      if state.count >= @max_queue_size do
        {_reply, _, state} = handle_call(:flush, from, state)
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

    {:reply, :ok, state}
  end

  def handle_call(:flush, _from, state) do
    if state.timer do
      :timer.cancel(state.timer)
    end

    entries = for {message, timestamp, metadata, level} <- state.queue do
      {ymd, {h,m,s, _}} = timestamp
      timestamp = {ymd, {h,m,s}}
      %{
        message: to_string(message),
        level: to_string(level),
        timestamp: Ecto.DateTime.from_erl(timestamp),
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
end
