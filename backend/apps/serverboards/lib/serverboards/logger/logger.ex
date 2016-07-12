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

  alias Serverboards.Logger.Model
  alias Serverboards.Repo

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


  # implementation of Logger.log

  def ignore_applications do
    [ :ecto ]
  end

  def init(_opts) do
    {:ok, %{ ignore_applications: ignore_applications }}
  end

  def handle_event(:flush, state) do
    #IO.puts("Logs Flush")

    {:ok, state}
  end
  def handle_event({level, group_leader, {Logger, message, timestamp, metadata}}, state) do
    if (not metadata[:application] in state.ignore_applications) or (level != :debug) do
      changelog = Model.Line.changelog(%Model.Line{}, %{
        message: to_string(message),
        level: to_string(level),
        timestamp: timestamp,
        meta: Map.new(metadata, fn {k,v} -> {k, inspect v} end)
        })
      try do
        case Repo.insert( changelog ) do
          {:ok, _} -> :ok
          {:error, changeset} ->
            IO.puts("Error storing log line: #{inspect changeset}")
            :error
        end
      catch
        :exit, reason ->
          IO.puts("Error storing log line: #{inspect reason} (maybe not ready yet)")
          :error
      end
    end

    #IO.puts("Logs #{inspect level} #{inspect group_leader} #{inspect message} #{inspect timestamp} #{inspect metadata}")

    {:ok, state}
  end
  def handle_event({:configure, opts}, state) do
    IO.puts("Logs configure: #{inspect opts}")
  end
end
