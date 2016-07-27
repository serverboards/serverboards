require Logger

defmodule Serverboards.Serverboard.Widget do
  @moduledoc ~S"""
  Widget management

  This implements a basic CRUD over the widgets.
  """
  alias Serverboards.Serverboard.Model
  alias Serverboards.Repo

  def setup_eventsourcing(es) do
    EventSourcing.subscribe es, :add_widget, fn attr, _me ->
      widget_add_real(attr.serverboard, attr)
    end
    EventSourcing.subscribe es, :update_widget, fn attr, _me ->
      widget_update_real(attr.uuid, attr)
    end
    EventSourcing.subscribe es, :remove_widget, fn attr, _me ->
      widget_remove_real(attr.uuid)
    end
  end

  def widget_list(serverboard) do
    import Ecto.Query
    list = Repo.all( from w in Model.Widget,
      join: s in Model.Serverboard,
        on: s.id == w.serverboard_id,
      where: s.shortname == ^serverboard,
      select: %{ widget: w.widget, uuid: w.uuid, config: w.config, ui: w.ui }
      )
    {:ok, list}
  end


  @doc ~S"""
  Returns the list of compatible plugins for the given serverboard.

  Compatibility depends on installed services / traits.

  TODO. Now returns all.
  """
  def catalog(_serverboard) do
    for w <- Serverboards.Plugin.Registry.filter_component([type: "widget"]) do
      %{
        id: w.id,
        name: w.name,
        description: w.description,
        params: w.extra["params"]
      }
    end
  end

  def widget_add(serverboard, data, me) do
    Logger.debug("Pre #{inspect data}")
    uuid = data[:uuid] || UUID.uuid4
    data = Map.merge(data, %{ serverboard: serverboard, uuid: uuid })
    Logger.debug("Post #{inspect data}")
    EventSourcing.dispatch(:serverboard, :add_widget, data, me.email )
    {:ok, data.uuid}
  end
  def widget_add_real(serverboard, data) do
    import Ecto.Query
    serverboard_id = Repo.one(
      from s in Model.Serverboard,
      where: s.shortname == ^serverboard,
      select: s.id
      )
    data = Map.put(data, :serverboard_id, serverboard_id)
    {:ok, _widget} = Repo.insert( Model.Widget.changeset(%Model.Widget{}, data) )

    Serverboards.Event.emit("serverboard.widget.added", data, ["serverboard.info"])
    Serverboards.Event.emit("serverboard.widget.added[#{serverboard}]", data, ["serverboard.info"])
    {:ok, data.uuid}
  end

  def widget_update(uuid, data, me) do
    EventSourcing.dispatch(:serverboard, :update_widget, Map.merge(data, %{ uuid: uuid }), me.email )
    :ok
  end
  def widget_update_real(uuid, data) do
    import Ecto.Query
    prev = Repo.one(
          from s in Model.Widget,
          where: s.uuid == ^uuid
          )
    Repo.update( Model.Widget.changeset(prev, data) )

    Serverboards.Event.emit("serverboard.widget.updated", data, ["serverboard.info"])
    serverboard = Repo.one(
      from s in Model.Serverboard,
      where: s.id == ^prev.serverboard_id,
      select: s.shortname
    )
    Serverboards.Event.emit("serverboard.widget.updated[#{serverboard}]", data, ["serverboard.info"])
    :ok
  end

  def widget_remove(uuid, me) do
    EventSourcing.dispatch(:serverboard, :remove_widget, %{ uuid: uuid }, me.email )
    :ok
  end
  def widget_remove_real(uuid) do
    import Ecto.Query
    serverboard = Repo.one(
      from s in Model.Serverboard,
      join: w in Model.Widget,
      on: w.serverboard_id == s.id,
      where: w.uuid == ^uuid,
      select: s.shortname
    )
    Repo.delete_all(
      from s in Model.Widget,
      where: s.uuid == ^uuid
      )
    Serverboards.Event.emit("serverboard.widget.removed", %{uuid: uuid}, ["serverboard.info"])
    Serverboards.Event.emit("serverboard.widget.removed[#{serverboard}]", %{uuid: uuid}, ["serverboard.info"])
    :ok
  end
end
