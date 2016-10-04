alias Serverboards.Logger.Model
alias Serverboards.Repo

defmodule Serverboards.Logger do
  @moduledoc ~S"""
  Stores log messages into the database.

  It has some care not to store database messages, as they can generate new
  log events.

  TODO:
    * Use a queue in state and flush it at :flush. This should increase throughput
    * First message always fails because database is not ready yet.
  """
  use GenEvent

  @doc ~S"""
  Returns a list of mesages, it can receive a filter

  * start -- maximum id to show (not included). Used for paging
  * count -- how many messages to show
  """
  def history(options \\ %{}) do
    import Ecto.Query

    # count total lines
    q = from l in Model.Line,
      select: count(l.id)
    count = Repo.one( q )


    # Get the lines from start to start+count
    q =    from l in Model.Line,
       order_by: [desc: l.id],
          limit: ^Map.get(options, :count, 50),
         select: %{ message: l.message, timestamp: l.timestamp, level: l.level, meta: l.meta, id: l.id}
     q = case options[:start] do
       nil -> q
       id -> where(q, [l], l.id < ^id )
     end
    lines = Repo.all(q)

    {:ok, %{ lines: lines, count: count }}
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
    {:ok, server} = Serverboards.Logger.Server.start_link name: Serverboards.Logger.Server
    {:ok, %{ ignore_applications: ignore_applications, queue: [], server: server }}
  end

  def handle_event(:flush, state) do
    Serverboards.Logger.Server.flush(state.server)
    {:ok, state}
  end
  # ignore if im not group leader
  def handle_event({_level, gl, {Logger, _, _, _}}, state)
      when node(gl) != node() do
    {:ok, state}
  end
  def handle_event({level, _group_leader, {Logger, message, timestamp, metadata}}, state) do
    if should_log?(metadata, level) do
      Serverboards.Logger.Server.log(state.server, {message, timestamp, metadata, level})
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

  @max_queue_size 10

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
    state = if state.count >= @max_queue_size do
      {_reply, _, state} = handle_call(:flush, from, state)
      state
    else
      state
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
