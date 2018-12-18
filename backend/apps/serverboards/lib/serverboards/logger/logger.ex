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
  @behaviour :gen_event

  @doc ~S"""
  Returns a list of mesages, it can receive a filter

  * start -- maximum id to show (not included). Used for paging
  * count -- how many messages to show
  * service -- Only for related service
  * extra -- map of extra meta fields and value, for example {plugin: "serverboards.core.ssh"}
  * q -- text search via ts_vectors
  """
  def history(options \\ %{}) do
    import Ecto.Query

    try do
      Serverboards.Logger.Server.flush(Serverboards.Logger.Server)
    catch
      :exit, _ -> nil
    end

    # Prepare the main query
    q = from(l in Model.Line)

    q =
      case options[:service] do
        nil ->
          q

        id ->
          where(
            q,
            [l],
            fragment("?->>'service' = ?", l.meta, ^id) or
              fragment("?->>'service_id' = ?", l.meta, ^id)
          )
      end

    q =
      case options[:extra] do
        nil ->
          q

        extral ->
          Enum.reduce(extral, q, fn {k, v}, acc ->
            where(acc, [l], fragment("?->>? = ?", l.meta, ^k, ^v))
          end)
      end

    q =
      case options[:q] do
        nil ->
          q

        query ->
          where(
            q,
            [l],
            fragment(
              "to_tsvector('english', ? || ?::text) @@ to_tsquery('english',?)",
              l.message,
              l.meta,
              ^to_tsquery(query)
            )
          )
      end

    # count total lines. Postgresql is slow jsut counting all rows.
    # See https://wiki.postgresql.org/wiki/Slow_Counting and https://wiki.postgresql.org/wiki/Count_estimate
    is_plain_list =
      options
      |> Map.keys()
      |> MapSet.new()
      |> MapSet.intersection(MapSet.new([:service, :extra, :q]))
      |> Enum.count() == 0

    count =
      if is_plain_list do
        res =
          Ecto.Adapters.SQL.query!(
            Repo,
            "SELECT reltuples::integer AS approximate_row_count FROM pg_class WHERE relname = 'logger_line';",
            []
          )

        res.rows |> hd |> hd
      else
        qcount = select(q, [l], count(l.id))
        Repo.one(qcount)
      end

    # get the lines, current window
    qlines =
      q
      |> select([l], %{
        message: l.message,
        timestamp: l.timestamp,
        level: l.level,
        meta: l.meta,
        id: l.id
      })
      |> limit(^Map.get(options, :count, 50))
      |> order_by([l], desc: l.id)

    qlines =
      case options[:start] do
        nil -> qlines
        id -> where(qlines, [l], l.id < ^id)
      end

    qlines =
      case options[:until] do
        nil -> qlines
        id -> where(qlines, [l], l.id > ^id)
      end

    qlines =
      case options[:offset] do
        nil -> qlines
        offs -> qlines |> offset(^offs)
      end

    lines = Repo.all(qlines)

    {:ok, %{lines: lines, count: count}}
  end

  defp to_tsquery(txt) do
    txt
    |> String.split(" ", trim: true)
    |> Enum.join(" & ")
  end

  defp should_log?(metadata, level) do
    cond do
      metadata[:application] == :ecto -> false
      # only store when in debug mode.
      level == :debug -> Application.get_env(:serverboards, :debug)
      true -> true
    end
  end

  # implementation of Logger.log

  def ignore_applications do
    [:ecto]
  end

  def init(_opts) do
    children = [
      Supervisor.Spec.worker(Serverboards.Logger.Server, [[name: Serverboards.Logger.Server]])
    ]

    {:ok, supervisor} = Supervisor.start_link(children, strategy: :one_for_one)

    {:ok, %{ignore_applications: ignore_applications(), queue: [], supervisor: supervisor}}
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
      Serverboards.Logger.Server.log(
        Serverboards.Logger.Server,
        {message, timestamp, metadata, level}
      )
    end

    {:ok, state}
  end

  def handle_event({:configure, opts}, _state) do
    IO.puts("Logs configure: #{inspect(opts)}")
  end

  @doc false
  def handle_call(_msg, state) do
    {:ok, state}
  end

  @doc false
  def handle_info(_msg, state) do
    {:ok, state}
  end

  @doc false
  def terminate(_reason, _state) do
    :ok
  end

  @doc false
  def code_change(_old, state, _extra) do
    {:ok, state}
  end
end
