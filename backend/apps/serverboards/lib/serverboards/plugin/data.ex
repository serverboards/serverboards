require Logger

defmodule Serverboards.Plugin.Data do
  @moduledoc ~S"""
  Stores data related to plugins or components in a KV store.

  This allows easy storing of dat from the plugin side.
  """
  alias Serverboards.Plugin.Model
  alias Serverboards.Repo

  def start_link(options \\ []) do
    {:ok, es} = EventSourcing.start_link([name: :plugin_data] ++ options)

    EventSourcing.subscribe(es, :data_set, fn %{plugin: plugin, key: key, value: value}, _me ->
      data_set_real(plugin, key, value)
    end)

    EventSourcing.subscribe(es, :data_remove, fn %{plugin: plugin, key: key}, _me ->
      data_remove_real(plugin, key)
    end)

    {:ok, es}
  end

  def data_set(pluginid, key, value, me) do
    EventSourcing.dispatch(
      :plugin_data,
      :data_set,
      %{plugin: pluginid, key: key, value: value},
      me.email
    )

    Serverboards.Event.emit(
      "plugin.data_changed",
      %{plugin: pluginid, key: key, value: value},
      ["plugin.data[#{pluginid}]"]
    )

    Serverboards.Event.emit(
      "plugin.data_changed[#{pluginid}]",
      %{plugin: pluginid, key: key, value: value},
      ["plugin.data"]
    )

    :ok
  end

  def data_set_real(pluginid, key, value) when is_map(value) do
    import Ecto.Query
    changes = %{plugin: pluginid, key: key, value: value}

    ret =
      case Repo.all(
             from(d in Model.Data,
               where: d.plugin == ^pluginid and d.key == ^key
             )
           ) do
        [] ->
          Repo.insert(Model.Data.changeset(%Model.Data{}, changes))

        [prev] ->
          Repo.update(Model.Data.changeset(prev, changes))
      end

    # Logger.debug("Data set: #{pluginid}/#{key}: #{inspect value} -> #{inspect ret}")
    ret
  end

  def data_set_real(pluginid, key, value) do
    # if not a straigth map, pack it inside one
    data_set_real(pluginid, key, %{__value__: value})

    if key == "is_active" do
      Serverboards.Plugin.Registry.reload_plugins()
    end

    :ok
  end

  def data_get(pluginid, key, default \\ %{}) do
    import Ecto.Query

    value =
      case Repo.one(
             from(d in Model.Data,
               where: d.plugin == ^pluginid and d.key == ^key,
               select: d.value
             )
           ) do
        nil -> default
        other -> other
      end

    # unpack from object with key __value__
    case value do
      %{"__value__" => value} -> value
      value -> value
    end
  end

  def data_remove(pluginid, key, me) do
    EventSourcing.dispatch(:plugin_data, :data_remove, %{plugin: pluginid, key: key}, me.email)

    Serverboards.Event.emit(
      "plugin.data_changed",
      %{plugin: pluginid, key: key, value: nil},
      ["plugin.data[#{pluginid}]"]
    )

    :ok
  end

  def data_remove_real(pluginid, key) do
    import Ecto.Query

    Repo.delete_all(
      from(d in Model.Data,
        where: d.plugin == ^pluginid and d.key == ^key
      )
    )
  end

  @doc ~S"""
  Returns the keys of some plugin data, filtered by prefix.
  """
  def data_keys(pluginid, keyprefix) do
    import Ecto.Query

    Repo.all(
      from(d in Model.Data,
        where: d.plugin == ^pluginid and like(d.key, ^"#{keyprefix}%"),
        select: d.key
      )
    )
  end

  @doc ~S"""
  Returns the items {key, value} of some plugin data, filtered by prefix.
  """
  def data_items(pluginid, keyprefix) do
    import Ecto.Query

    Repo.all(
      from(d in Model.Data,
        where: d.plugin == ^pluginid and like(d.key, ^"#{keyprefix}%"),
        select: {d.key, d.value}
      )
    )
  end
end
