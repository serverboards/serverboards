require Logger

defmodule Serverboards.Query.Executor do
  @moduledoc """
  Extractor part of the USQ.
  """

  @doc ~S"""
  Calls a plugin extractor to extract the data

  It uses a 15s cache to avoid pounding the pligin with the same request. As a
  side effect it may timeout and take more time.
  """
  def execute(config, table, quals, columns) do
    Serverboards.Utils.Cache.get({:execute, config, table, quals, columns}, fn ->
      extractor = config.extractor

    # Logger.debug("Use extractor #{inspect extractor}")
      [component] = Serverboards.Plugin.Registry.filter_component(id: extractor)

      res = Serverboards.Plugin.Runner.call(
        component.extra["command"],
        Map.get(component.extra, "extractor", "extractor"),
        [config, table, quals, columns],
        config.user)

      case res do
        {:ok, result} ->
          {:ok, %{ columns: result["columns"], rows: result["rows"] }}
        {:error, error} ->
          Logger.error("Error geting data from #{inspect extractor} / #{inspect table}")
          {:error, error}
      end
    end, ttl: 15_000, timeout: 60_000)
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
          Serverboards.Plugin.Runner.call(
            component.extra["command"],
            Map.get(component.extra, "schema", "schema"),
            [config, nil],
            config.user)
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
          res = Serverboards.Plugin.Runner.call(
            component.extra["command"],
            Map.get(component.extra, "schema", "schema"),
            [config, table],
            config.user)
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
end
