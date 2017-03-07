require Logger

defmodule Serverboards.Project.Widget do
  @moduledoc ~S"""
  Widget management

  This implements a basic CRUD over the widgets.
  """
  alias Serverboards.Project.Model
  alias Serverboards.Repo

  def setup_eventsourcing(es) do
    EventSourcing.subscribe es, :add_widget, fn attr, _me ->
      widget_add_real(attr.project, attr)
    end
    EventSourcing.subscribe es, :update_widget, fn attr, _me ->
      widget_update_real(attr.uuid, attr)
    end
    EventSourcing.subscribe es, :remove_widget, fn attr, _me ->
      widget_remove_real(attr.uuid)
    end
  end

  def widget_list(project) do
    import Ecto.Query
    list = Repo.all( from w in Model.Widget,
      join: s in Model.Project,
        on: s.id == w.project_id,
      where: s.shortname == ^project,
      select: %{ widget: w.widget, uuid: w.uuid, config: w.config, ui: w.ui }
      )
    {:ok, list}
  end


  @doc ~S"""
  Returns the list of compatible plugins for the given project.

  Compatibility depends on installed services / traits.

  TODO. Now returns all.
  """
  def catalog(_project) do
    for w <- Serverboards.Plugin.Registry.filter_component([type: "widget"]) do
      %{
        id: w.id,
        name: w.name,
        description: w.description,
        params: w.extra["params"]
      }
    end
  end

  def widget_add(project, data, me) do
    Logger.debug("Pre #{inspect data}")
    uuid = data[:uuid] || UUID.uuid4
    data = Map.merge(data, %{ project: project, uuid: uuid })
    Logger.debug("Post #{inspect data}")
    EventSourcing.dispatch(:project, :add_widget, data, me.email )
    {:ok, data.uuid}
  end
  def widget_add_real(project, data) do
    import Ecto.Query
    project_id = Repo.one(
      from s in Model.Project,
      where: s.shortname == ^project,
      select: s.id
      )
    data = Map.put(data, :project_id, project_id)
    {:ok, _widget} = Repo.insert( Model.Widget.changeset(%Model.Widget{}, data) )

    Serverboards.Event.emit("dashboard.widget.added", data, ["project.get"])
    Serverboards.Event.emit("dashboard.widget.added[#{project}]", data, ["project.get"])
    {:ok, data.uuid}
  end

  def widget_update(uuid, data, me) do
    EventSourcing.dispatch(:project, :update_widget, Map.merge(data, %{ uuid: uuid }), me.email )
    :ok
  end
  def widget_update_real(uuid, data) do
    import Ecto.Query
    prev = Repo.one(
          from s in Model.Widget,
          where: s.uuid == ^uuid
          )
    case Repo.update( Model.Widget.changeset(prev, data) ) do
      {:ok, _update} ->
        Serverboards.Event.emit("dashboard.widget.updated", data, ["project.get"])
        project = Repo.one(
          from s in Model.Project,
          where: s.id == ^prev.project_id,
          select: s.shortname
        )
        Serverboards.Event.emit("dashboard.widget.updated[#{project}]", data, ["project.get"])
        :ok
      {:error, reason} ->
        Logger.error("Error updating widget: #{inspect reason}")
        {:error, reason}
    end
  end

  def widget_remove(uuid, me) do
    EventSourcing.dispatch(:project, :remove_widget, %{ uuid: uuid }, me.email )
    :ok
  end
  def widget_remove_real(uuid) do
    import Ecto.Query
    project = Repo.one(
      from s in Model.Project,
      join: w in Model.Widget,
      on: w.project_id == s.id,
      where: w.uuid == ^uuid,
      select: s.shortname
    )
    Repo.delete_all(
      from s in Model.Widget,
      where: s.uuid == ^uuid
      )
    Serverboards.Event.emit("dashboard.widget.removed", %{uuid: uuid}, ["project.get"])
    Serverboards.Event.emit("dashboard.widget.removed[#{project}]", %{uuid: uuid}, ["project.get"])
    :ok
  end
end
