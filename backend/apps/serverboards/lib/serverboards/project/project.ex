require Logger

defmodule Serverboards.Project do
  import Ecto.Query

  alias Serverboards.Repo
  alias Serverboards.Project.Model.Project, as: ProjectModel
  alias Serverboards.Project.Model.Dashboard, as: DashboardModel
  alias Serverboards.Project.Model.ProjectTag, as: ProjectTagModel

  def start_link(_options) do
    {:ok, es} = EventSourcing.start_link name: :project
    {:ok, _rpc} = Serverboards.Project.RPC.start_link

    EventSourcing.Model.subscribe :project, :project, Serverboards.Repo
    #EventSourcing.subscribe :project, :debug_full

    setup_eventsourcing(es)
    Serverboards.Project.Widget.setup_eventsourcing(es)
    Serverboards.Project.Dashboard.setup_eventsourcing(es)

    {:ok, es}
  end

  def setup_eventsourcing(es) do
    EventSourcing.subscribe es, :add_project, fn attributes, me ->
      {:ok, project} = Repo.insert( ProjectModel.changeset(%ProjectModel{}, attributes) )

      Enum.map(Map.get(attributes, :tags, []), fn name ->
        Repo.insert( %ProjectTagModel{name: name, project_id: project.id} )
      end)

      Serverboards.Service.service_update_project_real( project.shortname, attributes, me )

      project = %{
        project |
        inserted_at: DateTime.to_iso8601(project.inserted_at),
        updated_at: DateTime.to_iso8601(project.updated_at)
      }
      Serverboards.Event.emit("project.created", %{ project: project}, ["project.get"])

      dashboard_attrs = %{
        project_id: project.id,
        name: "Monitoring",
        order: 0,
        config: %{},
        uuid: UUID.uuid4
      }

      {:ok, dashboard} = Repo.insert(DashboardModel.changeset(%DashboardModel{}, dashboard_attrs))
      Serverboards.Event.emit("dashboard.created", %{ dashboard: dashboard}, ["project.get"])

      project.shortname
    end, name: :project

    EventSourcing.subscribe es, :update_project, fn [shortname, operations], me ->
      import Ecto.Query
      # update tags
      project = Repo.get_by!(ProjectModel, shortname: shortname)

      tags = Map.get(operations, :tags, nil)
      if tags != nil do
        update_project_tags_real(project, tags)
      end

      {:ok, upd} = Repo.update( ProjectModel.changeset(
        project, operations
      ) )

      {:ok, project} = project_get upd, me
      project = %{
        project |
        inserted_at: DateTime.to_iso8601(project.inserted_at),
        updated_at: DateTime.to_iso8601(project.updated_at)
      }
      Serverboards.Event.emit(
        "project.updated",
        %{ shortname: shortname, project: project},
        ["project.get"]
        )
      Serverboards.Event.emit(
        "project.updated[#{shortname}]",
        %{ shortname: shortname, project: project},
        ["project.get"]
        )

      :ok
    end

    EventSourcing.subscribe es, :delete_project, fn shortname, _me ->
      Repo.delete_all( from s in ProjectModel, where: s.shortname == ^shortname )

      Serverboards.Event.emit("project.deleted", %{ shortname: shortname}, ["project.get"])
    end
  end

  defp update_project_tags_real(project, tags) do
    import Ecto.Query
    tags = MapSet.new(
      tags
        |> Enum.filter(&(&1 != ""))
      )

    current_tags = Repo.all(from st in ProjectTagModel, where: st.project_id == ^project.id, select: st.name )
    current_tags = MapSet.new current_tags

    new_tags = MapSet.difference(tags, current_tags)
    expired_tags = MapSet.difference(current_tags, tags)

    Logger.debug("Update project tags. Current #{inspect current_tags}, add #{inspect new_tags}, remove #{inspect expired_tags}")

    if (Enum.count expired_tags) > 0 do
      expired_tags = MapSet.to_list expired_tags
      Repo.delete_all( from t in ProjectTagModel, where: t.project_id == ^project.id and t.name in ^expired_tags )
    end
    Enum.map(new_tags, fn name ->
      Repo.insert( %ProjectTagModel{name: name, project_id: project.id} )
    end)
  end

  @doc ~S"""
  Creates a new project given the shortname, attributes and creator_id

  Attributes is a Map with the project attributes (strings, not atoms) All are optional.

  Attributes:
  * name -- project name
  * description -- Long description
  * priority -- Used for sorting, increasing.
  * tags -- List of tags to apply.

  ## Example

    iex> user = Test.User.system
    iex> {:ok, "SBDS-TST1"} = project_add "SBDS-TST1", %{ "name" => "projects" }, user
    iex> {:ok, info} = project_get "SBDS-TST1", user
    iex> info.name
    "projects"
    iex> project_delete "SBDS-TST1", user
    :ok

  """
  def project_add(shortname, attributes, me) do
    EventSourcing.dispatch :project, :add_project, %{
      shortname: shortname,
      creator_id: Map.get(me, :id),
      name: Map.get(attributes,"name", shortname),
      description: Map.get(attributes, "description", ""),
      priority: Map.get(attributes, "priority", 50),
      tags: Map.get(attributes, "tags", []),
      services: Map.get(attributes, "services", [])
    }, me.email
    {:ok, shortname}
  end



  @doc ~S"""
  Updates a project by id or shortname

  ## Example:

    iex> user = Test.User.system
    iex> {:ok, "SBDS-TST2"} = project_add "SBDS-TST2", %{ "name" => "projects" }, user
    iex> :ok = project_update "SBDS-TST2", %{ "name" => "projects" }, user
    iex> {:ok, info} = project_get "SBDS-TST2", user
    iex> info.name
    "projects"
    iex> project_delete "SBDS-TST2", user
    :ok

  """
  def project_update(project, operations, me) when is_map(project) do
    #Logger.debug("project_update #{inspect {project.shortname, operations, me}}, project id #{project.id}")

    # Calculate changes on project itself.
    changes = Enum.reduce(operations, %{}, fn op, acc ->
      Logger.debug("#{inspect op}")
      {opname, newval} = op
      opatom = case opname do
        "name" -> :name
        "description" -> :description
        "priority" -> :priority
        "tags" -> :tags
        "shortname" -> :shortname
        "services" -> :services
        e ->
          Logger.error("Unknown operation #{inspect e}. Failing.")
          raise RuntimeError, "Unknown operation updating project #{project.shortname}: #{inspect e}. Failing."
      end
      if opatom do
        Map.put acc, opatom, newval
      else
        acc
      end
    end)

    EventSourcing.dispatch(:project, :update_project, [project.shortname, changes], me.email)

    :ok
  end
  def project_update(project_id, operations, me) when is_number(project_id) do
    project_update(Repo.get_by(ProjectModel, [id: project_id]), operations, me)
  end
  def project_update(projectname, operations, me) when is_binary(projectname) do
    project_update(Repo.get_by(ProjectModel, [shortname: projectname]), operations, me)
  end

  @doc ~S"""
  Deletes a project by id or name
  """
  def project_delete(%ProjectModel{ shortname: shortname }, me) do
    EventSourcing.dispatch(:project, :delete_project, shortname, me.email)
    :ok
  end
  def project_delete(project_id, me) when is_number(project_id) do
    project_delete( Repo.get_by(ProjectModel, [id: project_id]), me )
  end
  def project_delete(project_shortname, me) when is_binary(project_shortname) do
    project_delete( Repo.get_by(ProjectModel, [shortname: project_shortname]), me )
  end

  @doc ~S"""
  Returns the information of a project by id or name

  TODO Return only services to which the user has access
  """
  def project_get(%ProjectModel{} = project, _me) do
    project = Repo.preload(project, :tags)

    project = %{
      project |
      tags: Enum.map(project.tags, fn t -> t.name end)
    }

    services = Serverboards.Service.service_list [project: project.shortname]
    project = Map.put(project, :services, services)
    project = Map.put(project, :screens, project_screens(project))
    dashboards = Serverboards.Project.Dashboard.dashboard_list(%{ project: project.shortname} )
      |> Enum.map(&(%{
        uuid: &1.uuid,
        name: &1.name,
        order: &1.order
        }))

    project = Map.put(project, :dashboards, dashboards )

    #Logger.info("Got project #{inspect project}")
    {:ok, project}
  end

  def project_get(project_id, me) when is_number(project_id) do
    case Repo.one( from( s in ProjectModel, where: s.id == ^project_id, preload: :tags ) ) do
      nil -> {:error, :not_found}
      project ->
        project_get(project, me)
    end
  end
  def project_get(project_shortname, me) when is_binary(project_shortname) do
    case Repo.one( from(s in ProjectModel, where: s.shortname == ^project_shortname, preload: :tags ) ) do
      nil -> {:error, :not_found}
      project ->
        project_get(project, me)
    end
  end

  @doc ~S"""
  Returns the related screens for this project
  """
  def project_screens(%{services: services}) do
    traits = Enum.reduce(services, [], fn s, acc ->
      case Serverboards.Plugin.Registry.find(s.type) do
        nil -> acc
        s -> s.traits ++ acc
      end
    end) |> MapSet.new

    Logger.debug("Looking for screens with traits: #{inspect traits}")
    screens =
      (Serverboards.Plugin.Registry.filter_component type: "screen", traits: traits)
      ++
      (Serverboards.Plugin.Registry.filter_component type: "screen", traits: :none)

    screens |> Enum.map( fn s ->
      hints = case Map.get(s.extra, "hints", "") do
        str when is_binary(str) ->
          String.split(str)
        map when is_map(map) ->
          map
      end

      %{
        id: s.id,
        name: s.name,
        icon: Map.get(s.extra, "icon", nil),
        description: s.description,
        traits: s.traits,
        perms: Map.get(s.extra, "perms", []),
        hints: hints
      }
    end)
  end

  @doc ~S"""
  Returns a list with all projects and its information

  ## Example

    iex> require Logger
    iex> user = Test.User.system
    iex> {:ok, l} = project_list user.id
    iex> is_list(l) # may be empty or has something from before, but lists
    true
    iex> {:ok, "SBDS-TST4"} = project_add "SBDS-TST4", %{ "name" => "projects" }, user
    iex> {:ok, l} = project_list user
    iex> Logger.debug(inspect l)
    iex> Enum.any? l, &(&1.shortname=="SBDS-TST4") # exists in the list?
    true
    iex> project_delete "SBDS-TST4", user
    :ok

  """
  def project_list(_me) do
    projects = Serverboards.Repo.all(from s in ProjectModel, preload: :tags )
     |> Enum.map( fn project ->
       %{ project | tags: Enum.map(project.tags, &(&1.name)) }
     end)
    {:ok, projects }
  end
end
