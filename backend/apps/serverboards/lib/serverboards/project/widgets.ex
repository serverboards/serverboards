require Logger
require Serverboards.Project.Model

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
    EventSourcing.subscribe es, :add_widget_v2, fn attr, _me ->
      widget_add_real_v2(attr.dashboard, attr)
    end
    EventSourcing.subscribe es, :update_widget, fn attr, _me ->
      widget_update_real(attr.uuid, attr)
    end
    EventSourcing.subscribe es, :remove_widget, fn attr, _me ->
      widget_remove_real(attr.uuid)
    end
  end

  # DEPRECATED 17.04 > Only access by dashboard
  def widget_list(dashboard_or_project) do
    import Ecto.Query
    list = if String.length(dashboard_or_project) == 36 do # uuid
      Repo.all( from w in Model.Widget,
        join: d in Model.Dashboard, on: w.dashboard_id == d.id,
        where: d.uuid == ^dashboard_or_project,
        select: %{ widget: w.widget, uuid: w.uuid, config: w.config, ui: w.ui }
        )
    else # project_shortname
      Repo.all( from w in Model.Widget,
        join: d in Model.Dashboard, on: w.dashboard_id == d.id,
        join: p in Model.Project,   on: p.id == d.project_id,
        where: p.shortname == ^dashboard_or_project,
        select: %{ widget: w.widget, uuid: w.uuid, config: w.config, ui: w.ui }
        )
    end

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
    uuid = data[:uuid] || UUID.uuid4
    data = Map.merge(data, %{ project: project, uuid: uuid })
    EventSourcing.dispatch(:project, :add_widget, data, me.email )
    {:ok, data.uuid}
  end
  def widget_add_real(project, data) do
    import Ecto.Query
    dashboard_uuid = Repo.one(
      from d in Model.Dashboard,
      join: p in Model.Project, on: p.id == d.project_id,
      where: p.shortname == ^project,
      select: d.uuid,
      limit: 1
      )
    Logger.warn("DEPRECATED ADD WIDGET TO PROJECT #{inspect dashboard_uuid}")
    widget_add_real_v2(dashboard_uuid, data)
  end

  def widget_add_v2(dashboard, data, me) do
    uuid = data[:uuid] || UUID.uuid4
    data = Map.merge(data, %{ dashboard: dashboard, uuid: uuid })
    EventSourcing.dispatch(:project, :add_widget_v2, data, me.email )
    {:ok, data.uuid}
  end
  def widget_add_real_v2(dashboard, data) when is_binary(dashboard) do
    import Ecto.Query
    dashboard_id = Repo.one(
      from s in Model.Dashboard,
      where: s.uuid == ^dashboard,
      select: s.id
      )
    data = Map.put(data, :dashboard_id, dashboard_id)
    {:ok, _widget} = Repo.insert( Model.Widget.changeset(%Model.Widget{}, data) )

    Serverboards.Event.emit("dashboard.widget.created", data, ["project.get"])
    Serverboards.Event.emit("dashboard.widget.created[#{dashboard}]", data, ["project.get"])
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
        {project, dashboard} = Repo.one(
          from p in Model.Project,
          join: d in Model.Dashboard, on: d.project_id == p.id,
          where: d.id == ^prev.dashboard_id,
          select: {p.shortname, d.uuid}
        )
        Serverboards.Event.emit("dashboard.widget.updated[#{project}]", data, ["project.get"])
        Serverboards.Event.emit("dashboard.widget.updated[#{dashboard}]", data, ["project.get"])
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
    {project, dashboard} = Repo.one(
      from p in Model.Project,
      join: d in Model.Dashboard, on: d.project_id == p.id,
      join: w in Model.Widget, on: w.dashboard_id == d.id,
      where: w.uuid == ^uuid,
      select: {p.shortname, d.uuid}
    )
    Repo.delete_all(
      from s in Model.Widget,
      where: s.uuid == ^uuid
      )
    Serverboards.Event.emit("dashboard.widget.removed", %{uuid: uuid}, ["project.get"])
    Serverboards.Event.emit("dashboard.widget.removed[#{project}]", %{uuid: uuid}, ["project.get"])
    Serverboards.Event.emit("dashboard.widget.removed[#{dashboard}]", %{uuid: uuid}, ["project.get"])
    :ok
  end
end
