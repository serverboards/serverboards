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
    extractor = config.extractor

    Logger.debug("Use extractor #{inspect extractor}")
    [component] = Serverboards.Plugin.Registry.filter_component(id: extractor)

    case Serverboards.Plugin.Runner.start_call_stop(component.extra["command"], component.extra["extractor"], [config, table, quals, columns], config.user) do
      {:ok, result} ->
        {:ok, %{ headers: result["columns"], rows: result["rows"] }}
      other -> other
    end
  end

  @doc ~S"""
  Returns the list of tables on this extractor
  """
  def schema(config) do
    extractor = config.extractor
    [component] = Serverboards.Plugin.Registry.filter_component(id: extractor)

    Serverboards.Plugin.Runner.start_call_stop(component.extra["command"], component.extra["schema"], [config, nil], config.user)
  end

  @doc ~S"""
  Returns the schema of the given table.
  """
  def schema(config, table) do
    extractor = config.extractor
    [component] = Serverboards.Plugin.Registry.filter_component(id: extractor)

    res = Serverboards.Plugin.Runner.start_call_stop(component.extra["command"], component.extra["schema"], [config, table], config.user)
    case res do
      {:ok, %{ "columns" => columns}} ->
        columns = Enum.map(columns, fn
          %{ "name" => name } -> name
          other when is_binary(other) -> other
        end)
        {:ok, %{ headers: columns }}

      other -> other
    end
  end

  def query(query, context) do
    context = Enum.map(context, fn {k,v} ->
      nv = {Serverboards.Query, v}
      {k, nv}
    end) |> Map.new

    Logger.debug("Processed context #{inspect context}")

    with {:ok, %{ headers: headers, rows: rows}} <- ExoSQL.query(query, context) do
      {:ok, %{ columns: headers, rows: rows}}
    end
  end
end
