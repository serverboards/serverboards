require Logger

defmodule Serverboards.Query do
  @moduledoc ~S"""
  Universal Service Query.

  This module allows to use the services extractors to extract data and
  perform SQL querys.

  This is exported to the users at:
    * `dashboards.widgets.extract widget_id, extra_params`
    * `query.query sql, extra_params, context_data`

  Also available:
   * `query.schema [table]`

  context_data is the dictionary of services and configs. extra_params are
  extra parameters that are allowed to change in the `dashboards.widgets.extract`
  that does not require special permissions to access all data.
  """
  def query(query, context) do
    context = Enum.map(context, fn
      {"__" <> k, v} ->
        {"__" <> k, v}
      {k,v} -> # decorate the extractors
        nv = {Serverboards.Query.Executor, v}
        {k, nv}
    end) |> Map.new

    query = String.trim(query)
    # If not starts with SELECT, it is a simple text to use (rows at \n, cells at ,)
    if not is_sql(query) do
      csv_query(query)
    else
      # Logger.debug("Processed context #{inspect context}")
      real_query(query, context)
    end
  end

  defp csv_query(query) do
    res = case query do
      "" ->
        %{ columns: [{"tmp", "tmp", "?NONAME?"}], rows: [[""]]}
      _ ->
        {:ok, stream} = StringIO.open(query)
        stream = IO.binstream(stream, :line)
        rows = CSV.decode(stream)
          |> Enum.map(fn
            {:ok, line} -> line
            _other -> []
          end)
          |> Enum.filter(&(&1 != [])) # remove empty lines
        if String.starts_with?(query, "#") do
          [columns | rows] = rows
          [ h | rest ] = columns # remove #
          columns = [ String.slice(h, 1, 1000) | rest ]
            |> Enum.map(&({"tmp", "tmp", &1}))
          %{ columns: columns, rows: rows}
        else
          columns = Enum.map(List.first(rows), fn _r -> "?NONAME?" end )
          %{ columns: columns, rows: rows}
        end
    end
    {:ok,  res}
  end


  defp real_query("POLL " <> pquery, context) do
    # Just ignore poll, this is a frontend issue. Its here becaus eits
    # extrated from the widget config.
    [_n, query] = String.split(String.trim(pquery), [" ", "\t", "\n"], parts: 2)
    real_query(query, context)
  end

  defp real_query(query, context) do
    try do
      {time, result} = :timer.tc(ExoSQL, :query, [query, context])
      with {:ok, %{ columns: columns, rows: rows}} <- result do
        {:ok, %{ columns: columns, rows: rows, count: Enum.count(rows), time: time / 1_000_000.0}}
      else
        any ->
          Logger.error("Error performing query: #{inspect any}")
          any
      end
    rescue
      e in MatchError ->
        Logger.error("Error performing query: #{inspect e}: #{inspect System.stacktrace(), pretty: true}")
        # plan = with {:ok, parsed} <- ExoSQL.parse(query, context),
        #             {:ok, plan} <- ExoSQL.plan(parsed, context) do
        #               plan
        #             end
        # Logger.debug("Query plan is #{inspect plan, pretty: true}\n  #{inspect context["__vars__"], pretty: true}")
        {:error, {:invalid_sql, e.term}}
      exception in FunctionClauseError ->
        Logger.error("#{inspect exception}: #{inspect System.stacktrace, pretty: true}")
        {:error, :invalid_expression}
      exception ->
        Logger.error("#{inspect exception}: #{inspect System.stacktrace, pretty: true}")
        {:error, "Meditation code: `#{inspect exception}`. Ask for help at the forums."}
    catch
      :exit, {:timeout, where} ->
        Logger.error("Timeout performing query at #{inspect where, pretty: true}")
        {:error, :timeout}
      :exit, any ->
        Logger.error("Error performing query: #{inspect any}: #{inspect System.stacktrace(), pretty: true}")
        {:error, inspect(any)}
      any ->
        Logger.error("Error performing query: #{inspect any}: #{inspect System.stacktrace(), pretty: true}")
        {:error, inspect(any)}
    end
  end

  def is_sql(query) do
    query = String.upcase(query)
    String.starts_with?(query, "SELECT")
      || String.starts_with?(query, "WITH")
      || String.starts_with?(query, "POLL ")
  end
end
