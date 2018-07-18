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
      res = case query do
        "" ->
          %{ columns: ["?NONAME?"], rows: [[""]]}
        _ ->
          {:ok, stream} = StringIO.open(query)
          stream = IO.binstream(stream, :line)
          rows = CSV.decode(stream)
            |> Enum.map(fn
              {:ok, line} -> line
              _other -> []
            end)
            |> Enum.filter(&(&1 != [])) # remove empty lines
          columns = Enum.map(List.first(rows), fn _r -> "?NONAME?" end )
          %{ columns: columns, rows: rows}
      end
      {:ok,  res}
    else
      # Logger.debug("Processed context #{inspect context}")

      try do
        {time, result} = :timer.tc(ExoSQL, :query, [query, context])
        with {:ok, %{ columns: columns, rows: rows}} <- result do
          {:ok, %{ columns: columns, rows: rows, count: Enum.count(rows), time: time / 1_000_000.0}}
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
          {:error, inspect(any)}
      end
    end
  end

  def is_sql(query) do
    query = String.upcase(query)
    String.starts_with?(query, "SELECT") || String.starts_with?(query, "WITH")
  end
end
