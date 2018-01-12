require Logger

require EventSourcing

defmodule Serverboards.Service do
  alias Serverboards.Service.Model.Service, as: ServiceModel
  alias Serverboards.Service.Model.ServiceTag, as: ServiceTagModel
  alias Serverboards.Project.Model.Project, as: ProjectModel
  alias Serverboards.Project.Model.ProjectService, as: ProjectServiceModel
  alias Serverboards.Repo

  def start_link(_options) do
    {:ok, es} = EventSourcing.start_link name: :service
    {:ok, _rpc} = Serverboards.Service.RPC.start_link

    EventSourcing.Model.subscribe :service, :service, Serverboards.Repo

    setup_eventsourcing(es)

    {:ok, es}
  end

  def setup_eventsourcing(es) do
    import EventSourcing

    subscribe es, :add_service, fn attributes, me ->
      service_add_real(attributes.uuid, attributes, me)
    end
    subscribe es, :delete_service, fn service, me ->
      service_delete_real(service, me)
    end
    # This attach_service is idempotent
    subscribe es, :attach_service, fn [project, service], me ->
      service_attach_real(project, service, me)
    end
    subscribe es, :detach_service, fn [project, service], me ->
      service_detach_real(project, service, me)
    end
    subscribe es, :update_service, fn [service, operations], me ->
      service_update_real( service, operations, me)
    end

    # this is at a project, not at a service, updates services into that project
    subscribe :project, :update_project, fn [project, attributes], me ->
      service_update_project_real( project, attributes, me)
    end
  end

  defp service_update_real( uuid, operations, me) do
    import Ecto.Query
    service = Repo.get_by(ServiceModel, uuid: uuid)
    if service do
      service_id = service.id
      #Logger.debug("Operations: #{inspect operations}")
      changes = case Map.get(operations, :tags, Map.get(operations, "tags", nil)) do
        nil -> false
        l when is_list(l) ->
          update_tags_real(service, l)
          true
        s when is_binary(s) ->
          tags = String.split(s)
          update_tags_real(service, tags)
          true
      end


      changeset = ServiceModel.changeset(
        service, operations
      )
      changes = changes or (changeset.changes != %{})

      {:ok, upd} = Repo.update( changeset )

      ## If the status changed, update the tags, and get again
      status = service_check_status(uuid, me)
      {:ok, service} = service_update_tag(service_id, uuid, "status", status, me)

      Serverboards.Event.emit("service.updated", %{service: service}, ["service.get"])
      Serverboards.Event.emit("service.updated[#{upd.uuid}]", %{service: service}, ["service.get"])
      Serverboards.Event.emit("service.updated[#{upd.type}]", %{service: service}, ["service.get"])
      for p <- service.projects do
        Serverboards.Event.emit("service.updated[#{p}]", %{service: service}, ["service.get"])
      end

      if changes do
        Logger.info("Service #{inspect service.name} updated", service_id: uuid, user: me, operations: operations)
      end

      :ok
    else
      {:error, :not_found}
    end
  end

  defp service_update_tag(service_id, uuid, tag_category, tag, me) do
    {:ok, service} = service_get(uuid, me)
    fulltag = "#{tag_category}:#{tag}"
    {:ok, service} = if not Enum.member?(service.tags, fulltag) do
      newtags = Enum.filter(service.tags, &(not String.starts_with?(&1, tag_category)))
      newtags = if tag do
        [fulltag | newtags ]
      else
        newtags
      end
      update_tags_real(%{ id: service_id }, newtags)
      service = %{ service |
        tags: newtags
      }
      {:ok, service}
    else
      {:ok, service}
    end
  end

  defp service_check_status(uuid, me) do
    {:ok, service} = service_get(uuid, me)
    [type] = Serverboards.Plugin.Registry.filter_component(type: "service", id: service.type)
    status = type.extra["status"]
    if status do
      Logger.debug("Checking service update status #{inspect status, pretty: true}")
      res = Serverboards.Plugin.Runner.start_call_stop(status["command"], status["call"], %{ "service" => service }, me)
      case res do
        {:ok, status} ->
          status
        {:error, error} ->
          Logger.error("Error checking state of service: #{inspect error}", service_id: uuid)
          "error"
      end
    else
      nil
    end
  end

  defp update_tags_real(service, tags) do
    import Ecto.Query
    tags = MapSet.new tags

    current_tags = Repo.all(from ct in ServiceTagModel, where: ct.service_id == ^service.id, select: ct.name )
    current_tags = MapSet.new current_tags

    new_tags = MapSet.difference(tags, current_tags)
    expired_tags = MapSet.difference(current_tags, tags)

    if (Enum.count expired_tags) > 0 do
      expired_tags = MapSet.to_list expired_tags
      Repo.delete_all( from t in ServiceTagModel, where: t.service_id == ^service.id and t.name in ^expired_tags )
    end
    Enum.map(new_tags, fn name ->
      Repo.insert( %ServiceTagModel{name: name, service_id: service.id} )
    end)
  end

  def service_update_project_real( project, attributes, me) do
    import Ecto.Query

    case attributes do
      %{ services: services } ->
        current_uuids = services
          |> service_update_list_real(me)

        current_uuids
          |> Enum.map(fn uuid ->
            service_attach_real(project, uuid, me)
          end)

        # now detach from non listed uuids
        if (Enum.count current_uuids) == 0 do # remove all
          Repo.delete_all(
            from sc in ProjectServiceModel,
            join: s in ProjectModel,
              on: s.id == sc.project_id,
           where: s.shortname == ^project
           )
        else
          # remove only not updated
          ids_to_remove = Repo.all(
            from sc in ProjectServiceModel,
             join: c in ServiceModel,
               on: c.id == sc.service_id,
             join: s in ProjectModel,
               on: s.id == sc.project_id,
             where: s.shortname == ^project and
                    not (c.uuid in ^current_uuids),
            select: sc.id
          )
          Repo.delete_all(
             from sc_ in ProjectServiceModel,
            where: sc_.id in ^ids_to_remove
            )
        end

      _ ->
        nil
    end
    :ok
  end

  defp service_add_real( uuid, attributes, me) do
    user_id = case Serverboards.Auth.User.user_info( me, %{ email: me } ) do
      {:ok, user} ->
        user.id
      {:error, :unknown_user} -> # from command, where there is no user id
         nil
    end
    {:ok, servicem} = Repo.insert( %ServiceModel{
      uuid: uuid,
      name: attributes.name,
      type: attributes.type,
      creator_id: user_id,
      priority: attributes.priority,
      config: attributes.config
    } )

    Logger.info(
      "Created new service #{inspect servicem.name} (#{servicem.type})",
      service_id: uuid,
      user: me
      )

    service = decorate(servicem)
    Serverboards.Event.emit("service.updated[#{service.uuid}]", %{service: service}, ["service.get"])
    Serverboards.Event.emit("service.updated[#{service.type}]", %{service: service}, ["service.get"])
    for p <- service.projects do
      Serverboards.Event.emit("service.updated[#{p}]", %{service: service}, ["service.get"])
    end

    Enum.map(attributes.tags, fn name ->
      Repo.insert( %ServiceTagModel{name: name, service_id: servicem.id} )
    end)
  end

  defp service_delete_real( uuid, me) do
    import Ecto.Query

    service = decorate(uuid)
    Serverboards.Event.emit("service.deleted[#{service.uuid}]", %{service: service}, ["service.get"])
    Serverboards.Event.emit("service.deleted[#{service.type}]", %{service: service}, ["service.get"])
    for p <- service.projects do
      Serverboards.Event.emit("service.deleted[#{p}]", %{service: service}, ["service.get"])
    end


    # remove it when used inside any project
    Repo.delete_all(
      from sc in ProjectServiceModel,
      join: c in ServiceModel, on: c.id == sc.service_id,
      where: c.uuid == ^uuid
      )

    Logger.info(
      "Deleted service #{inspect uuid} (#{inspect service.type})",
      service: service,
      user: me
      )

    # 1 removed
    case Repo.delete_all( from c in ServiceModel, where: c.uuid == ^uuid ) do
      {1, _} -> :ok
      {0, _} -> {:error, :not_found}
    end
  end

  defp service_attach_real( project, service, me ) do
    import Ecto.Query
    case Repo.one(
        from sc in ProjectServiceModel,
          join: s in ProjectModel,
            on: s.id == sc.project_id,
          join: c in ServiceModel,
            on: c.id == sc.service_id,
          where: s.shortname == ^project and
                 c.uuid == ^service,
          select: sc.id ) do
      nil ->
        project_obj = Repo.get_by(ProjectModel, shortname: project)
        service_obj = Repo.get_by(ServiceModel, uuid: service)
        if Enum.all?([project_obj, service_obj]) do
          {:ok, _project_service} = Repo.insert( %ProjectServiceModel{
            project_id: project_obj.id,
            service_id: service_obj.id
          } )
        else
          Logger.warn("Trying to attach invalid project or service (#{project} (#{inspect project_obj}), #{service} (#{inspect service_obj}))")
        end

        {:ok, service} = service_get service_obj.uuid, me
        Serverboards.Event.emit("service.updated", %{service: service}, ["service.update"])
      _ ->  #  already in
        nil
    end
    :ok
  end

  defp service_detach_real(project, service, me ) do
    import Ecto.Query

    to_remove = Repo.all(
      from sc in ProjectServiceModel,
      join: s in ProjectModel, on: s.id == sc.project_id,
      join: c in ServiceModel, on: c.id == sc.service_id,
      where: c.uuid == ^service and s.shortname == ^project,
      select: sc.id
     )

    Repo.delete_all(
      from sc_ in ProjectServiceModel,
      where: sc_.id in ^to_remove )

    {:ok, service} = service_get service, me
    Serverboards.Event.emit("service.updated", %{service: service}, ["service.update"])
    :ok
  end

  # Updates all services in a give project, or creates them. Returns list of uuids.
  defp service_update_list_real( [], _me), do: []
  defp service_update_list_real( [ attributes | rest ], me) do
    uuid = case Map.get(attributes,"uuid",false) do
      false ->
        uuid=UUID.uuid4
        attributes = %{
          uuid: uuid,
          name: attributes["name"],
          type: attributes["type"],
          priority: Map.get(attributes,"priority", 50),
          tags: Map.get(attributes,"tags", []),
          config: Map.get(attributes,"config", %{}),
        }

        service_add_real( uuid, attributes, me )
        uuid
      uuid ->
        attributes = %{
          uuid: uuid,
          name: attributes["name"],
          type: attributes["type"],
          priority: Map.get(attributes,"priority", 50),
          tags: Map.get(attributes,"tags", []),
          config: Map.get(attributes,"config", %{}),
        }

        nattributes = Serverboards.Utils.drop_empty_values attributes

        service_update_real( uuid, nattributes, me )
        uuid
      end
    [uuid | service_update_list_real(rest, me)]
  end

  @doc ~S"""
  Adds a service to a project_shortname. Gives initial attributes.

  ## Example:

    iex> user = Test.User.system
    iex> {:ok, service} = service_add %{ "name" => "Generic", "type" => "generic" }, user
    iex> {:ok, info} = service_get service, user
    iex> info.priority
    50
    iex> info.name
    "Generic"
    iex> service_delete service, user
    :ok
  """
  def service_add(attributes, me) do
    attributes = %{
      uuid: UUID.uuid4,
      name: attributes["name"],
      type: attributes["type"],
      priority: Map.get(attributes,"priority", 50),
      tags: Map.get(attributes,"tags", []),
      config: Map.get(attributes,"config", %{}),
    }

    EventSourcing.dispatch(:service, :add_service, attributes, me.email)
    {:ok, attributes.uuid}
  end

  def service_delete(service, me) do
    EventSourcing.dispatch(:service, :delete_service, service, me.email)
    :ok
  end

  @doc ~S"""
  Lists all services, optional filter

  ## Example

    iex> user = Test.User.system
    iex> {:ok, _service_a} = service_add %{ "name" => "Generic A", "type" => "generic" }, user
    iex> {:ok, _service_b} = service_add %{ "name" => "Generic B", "type" => "email" }, user
    iex> {:ok, _service_c} = service_add %{ "name" => "Generic C", "type" => "generic" }, user
    iex> services = service_list []
    iex> service_names = Enum.map(services, fn c -> c.name end )
    iex> Enum.member? service_names, "Generic A"
    true
    iex> Enum.member? service_names, "Generic B"
    true
    iex> Enum.member? service_names, "Generic C"
    true
    iex> services = service_list [type: "email"]
    iex> service_names = Enum.map(services, fn c -> c.name end )
    iex> require Logger
    iex> Logger.info(inspect service_names)
    iex> not Enum.member? service_names, "Generic A"
    true
    iex> Enum.member? service_names, "Generic B"
    true
    iex> not Enum.member? service_names, "Generic C"
    true

  """
  def service_list(filter) do
    import Ecto.Query

    # Logger.info("Get service list for #{inspect filter}", filter: filter)

    query = if filter do
        Enum.reduce(filter, from(c in ServiceModel), fn {k,v}, acc ->
          case k do
            :name ->
              acc |>
                where([c], c.name == ^v)
            :type ->
              acc |>
                where([c], c.type == ^v)
            :project ->
              acc
                |> join(:inner,[c], sc in ProjectServiceModel, sc.service_id == c.id)
                |> join(:inner,[c,sc], s in ProjectModel, s.id == sc.project_id and s.shortname == ^v)
                |> select([c,sc,s], c)
            :traits -> # at post process
              acc
          end
        end)
      else
        ServiceModel
      end
    #Logger.info("#{inspect filter} #{inspect query}")
    res = Repo.all(query) |> Enum.map( &decorate(&1) )

    # post process
    if Keyword.has_key?(filter, :traits) do
      res |> Enum.filter( fn s ->
        Enum.all?(filter[:traits], &(&1 in s.traits))
      end)
    else
      res
    end
  end

  @doc ~S"""
  Returns a service from database properly decorated for external use, with
  fields and traits, and no internal data.

  Canbe get from uuid, or decorate an already got model.
  """
  def decorate(nil) do
    nil
  end
  def decorate(uuid) when is_binary(uuid) do
    import Ecto.Query
    case Repo.one( from c in ServiceModel, where: c.uuid == ^uuid, preload: :tags ) do
      nil -> nil
      service -> decorate(service)
    end
  end
  def decorate(service) do
    import Ecto.Query
    service = service
          |> Map.put(:tags, Enum.map(Repo.all(Ecto.assoc(service, :tags)), &(&1.name)) )
          |> Map.put(:projects, Repo.all(
            from s in ProjectModel,
            join: ss in ProjectServiceModel,
              on: ss.project_id == s.id,
           where: ss.service_id == ^service.id,
          select: s.shortname
            ))
    #Logger.debug(inspect service_catalog([type: service.type]))
    service = case service_catalog([type: service.type]) do
      [] ->
        service
          |> Map.put(:fields, [])
          |> Map.put(:traits, [])
          |> Map.put(:description, "")
          |> Map.put(:icon, nil)
      [service_definition | _other ] ->
        fields = service_definition.fields |> Enum.map(fn f ->
          Map.put(f, :value, Map.get(service.config, f["name"], ""))
        end)
        service = if service_definition[:virtual] do
          service |> Map.put(:virtual, service_definition.virtual)
        else
          service
        end
        service
          |> Map.put(:fields, fields)
          |> Map.put(:traits, service_definition.traits)
          |> Map.put(:icon, service_definition.icon)
    end

    service |> Map.take(~w(tags projects config uuid priority name type fields traits virtual description icon)a)
  end

  @doc ~S"""
  Gathers the config of a service
  """
  def service_config(uuid) do
    import Ecto.Query
    [config] = Repo.all(
      from s in ServiceModel,
      where: s.uuid == ^uuid,
      select: s.config
      )
    config
  end

  @doc ~S"""
  Attaches existing services to a project

  ## Example

    iex> user = Test.User.system
    iex> {:ok, service} = service_add %{ "name" => "Email server", "type" => "email" }, user
    iex> {:ok, _project} = Serverboards.Project.project_add "SBDS-TST7", %{ "name" => "projects" }, user
    iex> :ok = service_attach "SBDS-TST7", service, user
    iex> services = service_list [project: "SBDS-TST7"]
    iex> Enum.map(services, fn c -> c.name end )
    ["Email server"]
    iex> :ok = service_delete service, user
    iex> services = service_list [project: "SBDS-TST7"]
    iex> Enum.map(services, fn c -> c.name end )
    []
  """
  def service_attach(project, service, me) do
    EventSourcing.dispatch(:service, :attach_service, [project, service], me.email)
    :ok
  end

  @doc ~S"""
  Detaches existing services from a project

  ## Example

    iex> user = Test.User.system
    iex> {:ok, service} = service_add %{ "name" => "Email server", "type" => "email" }, user
    iex> {:ok, _project} = Serverboards.Project.project_add "SBDS-TST9", %{ "name" => "projects" }, user
    iex> :ok = service_attach "SBDS-TST9", service, user
    iex> services = service_list [project: "SBDS-TST9"]
    iex> Enum.map(services, fn c -> c.name end )
    ["Email server"]
    iex> :ok = service_detach "SBDS-TST9", service, user
    iex> services = service_list [project: "SBDS-TST9"]
    iex> Enum.map(services, fn c -> c.name end )
    []
    iex> {:ok, info} = service_get service, user
    iex> info.name
    "Email server"

  """
  def service_detach(project, service, me) do
    EventSourcing.dispatch(:service, :detach_service, [project, service], me.email)
    :ok
  end

  @doc ~S"""
  Returns info about a given service, including tags, name, config and projects
  it is in.

  IT is a wrapper with {:ok, _}/{:error, :now_found} semantics that in the
  future (TODO) will check for permission to access this service data
  """
  def service_get(service, _me) when is_binary(service) do
    case decorate(service) do
      nil -> {:error, :not_found}
      service -> {:ok, service}
    end
  end

  def service_update(service, operations, me) do
    changes = Enum.reduce(operations, %{}, fn op, acc ->
      {opname, newval} = op
      opatom = case opname do
        "name" -> :name
        "priority" -> :priority
        "tags" -> :tags
        "config" -> :config
        "description" -> :description
        e ->
          Logger.error("Unknown operation #{inspect e}. Failing.")
          raise RuntimeError, "Unknown operation updating service #{service}: #{inspect e}. Failing."
        end
        if opatom do
          Map.put acc, opatom, newval
        else
          acc
        end
      end)

    EventSourcing.dispatch(:service, :update_service, [service, changes], me.email)

    {:ok, service }
  end

  defp match_service_filter(service, {"traits", traits}), do: match_service_filter(service, {:traits, traits})
  defp match_service_filter(_service, {:traits, []}), do: false
  defp match_service_filter(service, {:traits, [trait | rest]}) do
    Logger.debug("trait #{trait} in #{inspect service}")
    cond do
      service.traits == nil ->
        Logger.debug("No traits")
        false
      trait in service.traits ->
        Logger.debug("ok")
        true
      true ->
        Logger.debug("keep looking")
        match_service_filter(service, {:traits, rest})
    end
  end
  defp match_service_filter(service, {"type", type}), do: match_service_filter(service, {:type, type})
  defp match_service_filter(service, {:type, type}) do
    type == service.id
  end

  @doc ~S"""
  Returns the list of available services (catalog) that fullfills a condition
  as type or traits

  Current allowed filters:
  * type -- Should return a list with one element, or empty. Matches the plugin/component id
  * traits -- MAtches any of the given traits. Empty matches none.

  ## Example

    iex> service_def_list = service_catalog([])
    iex> Enum.count(service_def_list) >= 1
    true

    iex> [specific_service_type] = service_catalog([type: "serverboards.test.auth/server" ])
    iex> specific_service_type.type
    "serverboards.test.auth/server"
    iex> specific_service_type.traits
    ["generic"]

    iex> [] = service_catalog([traits: ["wrong", "traits"]])
    iex> service_def_list = service_catalog([traits: ["wrong", "traits", "next_matches", "generic"]])
    iex> Enum.count(service_def_list) >= 1
    true

  """
  def service_catalog(filter) do
    Serverboards.Plugin.Registry.filter_component(type: "service")
      |> Enum.filter(fn service ->
        #Logger.debug("Match service catalog: #{inspect service}, #{inspect filter}")
        Enum.all?(filter, &match_service_filter(service, &1))
      end)
      |> Enum.map(fn service ->
        s = %{
          name: service.name,
          type: service.id,
          fields: service.extra["fields"],
          traits: service.traits,
          description: service.description,
          icon: service.extra["icon"],
         }
        s = if service.extra["virtual"] do
          Map.put(s, :virtual, service.extra["virtual"])
        else
          s
        end

        s
      end)
  end

  def service_definition(type) do
    case service_catalog(type: type) do
      [definition] -> definition
      _ -> nil
    end
  end
end
