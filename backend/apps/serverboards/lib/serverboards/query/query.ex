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

  def execute(config, table, quals, columns) do
    # Serverboards.Utils.Cache.get({:execute, config, table, quals, columns}, fn ->
      extractor = config.extractor

    # Logger.debug("Use extractor #{inspect extractor}")
      [component] = Serverboards.Plugin.Registry.filter_component(id: extractor)

      case Serverboards.Plugin.Runner.call(component.extra["command"], component.extra["extractor"], [config, table, quals, columns], config.user) do
        {:ok, result} ->
          {:ok, %{ columns: result["columns"], rows: result["rows"] }}
        {:error, error} ->
          Logger.error("Error geting data from #{inspect extractor} / #{inspect table}")
          {:error, error}
      end
    # end, ttl: 5_000)
  end

  @doc ~S"""
  Returns the list of tables on this extractor
  """
  def schema(config) do
    Serverboards.Utils.Cache.get({:schema, config}, fn ->
      # Logger.debug("schema #{inspect config}")
      extractor = config.extractor
      case Serverboards.Plugin.Registry.filter_component(id: extractor) do
        [component] ->
          Serverboards.Plugin.Runner.call(component.extra["command"], component.extra["schema"], [config, nil], config.user)
        _ ->
          {:error, :unknown_extractor}
      end
    end, ttl: 60_000)
  end

  @doc ~S"""
  Returns the schema of the given table.
  """
  def schema(config, table) do
    Serverboards.Utils.Cache.get({:schema, table, config}, fn ->
      # Logger.debug("schema #{inspect config} #{inspect table}")
      extractor = config.extractor
      case Serverboards.Plugin.Registry.filter_component(id: extractor) do
        [component] ->
          res = Serverboards.Plugin.Runner.call(component.extra["command"], component.extra["schema"], [config, table], config.user)
          case res do
            {:ok, %{ "columns" => columns}} ->
              columns = Enum.map(columns, fn
                %{ "name" => name } -> name
                other when is_binary(other) -> other
              end)
              {:ok, %{ columns: columns }}

            other -> other
          end
        _ ->
          {:error, {:unknown_extractor, extractor}}
      end
    end, ttl: 60_000)
  end

  def query(query, context) do
    context = Enum.map(context, fn
      {"__" <> k, v} ->
        {"__" <> k, v}
      {k,v} -> # decorate the extractors
        nv = {Serverboards.Query, v}
        {k, nv}
    end) |> Map.new

    # If not starts with SELECT, it is a simple text to use (rows at \n, cells at ,)
    if not String.starts_with?(String.upcase(query), "SELECT") do
      res = case query do
        "" ->
          %{ columns: "?NONAME?", rows: [[""]]}
        _ ->
          rows =
               String.split(query,"\n")
            |> Enum.map(&String.split(&1, ","))
            |> Enum.filter(&(&1 != [""])) # remove empty lines
          columns = Enum.map(List.first(rows), fn _r -> "?NONAME?" end )
          %{ columns: columns, rows: rows}
      end
      {:ok,  res}
    else
      # Logger.debug("Processed context #{inspect context}")

      try do
        with {:ok, %{ columns: columns, rows: rows}} <- ExoSQL.query(query, context) do
          {:ok, %{ columns: columns, rows: rows}}
        end
      catch
        :exit, {:timeout, where} ->
          Logger.error("Timeout performing query at #{inspect where, pretty: true}")
          {:error, :timeout}
        :exit, any ->
          Logger.error("Error performing query: #{inspect any}: #{Exception.format(:exit, any)}")
          {:error, inspect(any)}
        any ->
          {:error, inspect(any)}
      rescue
        e in MatchError ->
          Logger.error("Error performing query: #{inspect e}")
          {:error, :invalid_sql}
        exception in FunctionClauseError ->
          Logger.error("#{inspect exception}: #{inspect System.stacktrace, pretty: true}")
          {:error, :invalid_expression}
        exception ->
          Logger.error("#{inspect exception}: #{inspect System.stacktrace, pretty: true}")
          {:error, "Meditation code: `#{inspect exception}`. Ask for help at the forums."}
      end
    end
  end
end
