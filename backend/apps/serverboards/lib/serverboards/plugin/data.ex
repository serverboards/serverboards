defmodule Serverboards.Plugin.Data do
  @moduledoc ~S"""
  Stores data related to plugins or components in a KV store.

  This allows easy storing of dat from the plugin side.
  """
  alias Serverboards.Plugin.Model
  alias Serverboards.Repo

  def start_link(options \\ []) do
    {:ok, es} = EventSourcing.start_link [name: :plugin_data] ++ options

    EventSourcing.subscribe es, :data_set, fn %{ plugin: plugin, key: key, value: value}, _me ->
      data_set_real(plugin, key, value)
    end

    {:ok, es}
  end

  def data_set(pluginid, key, value, me) do
    EventSourcing.dispatch(:plugin_data, :data_set, %{ plugin: pluginid, key: key, value: value}, me.email)
    Serverboards.Event.emit(
      "plugin.data_changed",
      %{ plugin: pluginid, key: key, value: value},
      ["plugin.data[#{pluginid}]"]
      )
    :ok
  end

  def data_set_real(pluginid, key, value) do
    import Ecto.Query
    changes = %{ plugin: pluginid, key: key, value: value }

    case Repo.all(from d in Model.Data,
              where: d.plugin == ^pluginid and d.key == ^key )
      do
        [] ->
          Repo.insert(Model.Data.changeset( %Model.Data{}, changes ))
        [prev] ->
          Repo.update(Model.Data.changeset( prev, changes ))
    end
  end

  def data_get(pluginid, key) do
    import Ecto.Query
    case Repo.one(from d in Model.Data,
            where: d.plugin == ^pluginid and d.key == ^key,
            select: d.value ) do
      nil -> %{}
      other -> other
    end
  end
end
