require Logger
alias Serverboards.Project.Model
alias Serverboards.Repo

defmodule Serverboards.Project.Dashboard do
  def setup_eventsourcing(es) do
    EventSourcing.subscribe es, :add_dashboard, fn attr, me ->
      dashboard_add_real(attr, me)
    end
    EventSourcing.subscribe es, :update_dashboard, fn attr, _me ->
      dashboard_update_real(attr)
    end
    EventSourcing.subscribe es, :remove_dashboard, fn attr, _me ->
      dashboard_remove_real(attr.uuid)
    end
  end

  def dashboard_add( attr, me ) do
    data = Map.put( attr, :uuid, UUID.uuid4() )
    EventSourcing.dispatch(:project, :add_dashboard, data, me.email )
    {:ok, data.uuid}
  end

  def dashboard_update( attr, me ) do
    EventSourcing.dispatch(:project, :update_dashboard, attr, me.email )
  end

  def dashboard_remove( uuid, me ) do
    EventSourcing.dispatch(:project, :remove_dashboard, %{ uuid: uuid }, me.email )
    :ok
  end

  def dashboard_list( %{ project: project }, _me \\ nil ) do
    import Ecto.Query
    Repo.all(
      from d in Model.Dashboard,
      join: p in Model.Project, on: p.id == d.project_id,
      where: p.shortname == ^project,
      order_by: :order
      )
  end

  def dashboard_get_model(uuid) do
    import Ecto.Query
    Repo.one(
      from d in Model.Dashboard,
      where: d.uuid == ^uuid
    )
  end

  def dashboard_get( uuid ) do
    import Ecto.Query
    case dashboard_get_model( uuid ) do
      nil -> nil
      data ->
        widgets = Repo.all(
          from w in Model.Widget,
          where: w.dashboard_id == ^data.id
        )
        %{
          name: data.name,
          uuid: data.uuid,
          config: data.config,
          order: data.order,
          widgets: for w <- widgets do
            %{
              widget: w.widget,
              config: w.config,
              ui: w.ui,
              uuid: w.uuid
            }
          end
        }
    end
  end

  def dashboard_get_project_shortname( uuid ) do
    import Ecto.Query
    Repo.one(
      from d in Model.Dashboard,
      join: p in Model.Project, on: p.id == d.project_id,
      where: d.uuid == ^uuid,
      select: p.shortname
    )
  end

  def dashboard_count( project ) do
    import Ecto.Query
    Repo.one(
      from d in Model.Dashboard,
      join: p in Model.Project, on: p.id == d.project_id,
      where: p.shortname == ^project,
      select: count(d.id)
    )
  end

  def dashboard_add_real( %{ uuid: uuid } = attr, me) do
    {:ok, project} = Serverboards.Project.project_get( attr.project, me  )
    attr = Map.drop( attr, [:project] )
    attr = Map.put(attr, :project_id, project.id )
    attr = Map.put(attr, :order, dashboard_count( project.shortname ) )
    {:ok, _dashboard} = Repo.insert(
      Model.Dashboard.changeset( %{}, attr )
    )
    Serverboards.Event.emit("dashboard.created[#{project.shortname}]", attr, ["project.get"])
  end

  def dashboard_update_real( %{ uuid: uuid } = attr ) do
    Repo.update( Model.Dashboard.changeset( dashboard_get_model(uuid), attr ) )

    project_shortname = dashboard_get_project_shortname( uuid )
    Serverboards.Event.emit("dashboard.updated[#{uuid}]", attr, ["project.get"])
    Serverboards.Event.emit("dashboard.updated[#{project_shortname}]", attr, ["project.get"])
  end

  def dashboard_remove_real( uuid ) do
    import Ecto.Query
    project_shortname = dashboard_get_project_shortname( uuid )

    Repo.delete_all(
      from w in Model.Widget,
      join: d in Model.Dashboard, on: d.id == w.dashboard_id,
      where: d.uuid == ^uuid
    )
    Repo.delete_all(
      from d in Model.Dashboard,
      where: d.uuid == ^uuid
    )
    Serverboards.Event.emit("dashboard.removed[#{uuid}]", %{ uuid: uuid }, ["project.get"])
    Serverboards.Event.emit("dashboard.removed[#{project_shortname}]", %{ uuid: uuid }, ["project.get"])
  end

end
