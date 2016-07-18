require Logger

require EventSourcing

defmodule Serverboards.Service do
  alias Serverboards.Service.Model.Service, as: ServiceModel
  alias Serverboards.Service.Model.ServiceTag, as: ServiceTagModel
  alias Serverboards.Serverboard.Model.Serverboard, as: ServerboardModel
  alias Serverboards.Serverboard.Model.ServerboardService, as: ServerboardServiceModel
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
    subscribe es, :attach_service, fn [serverboard, service], me ->
      service_attach_real(serverboard, service, me)
    end
    subscribe es, :detach_service, fn [serverboard, service], me ->
      service_detach_real(serverboard, service, me)
    end
    subscribe es, :update_service, fn [service, operations], me ->
      service_update_real( service, operations, me)
    end

    # this is at a serverboard, not at a service, updates services into that serverboard
    subscribe :serverboard, :update_serverboard, fn [serverboard, attributes], me ->
      service_update_serverboard_real( serverboard, attributes, me)
    end
  end

  defp service_update_real( uuid, operations, me) do
    import Ecto.Query
    service = Repo.get_by(ServiceModel, uuid: uuid)
    if service do
      tags = MapSet.new Map.get(operations, :tags, [])

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

      {:ok, upd} = Repo.update( ServiceModel.changeset(
      service, operations
      ) )

      {:ok, service} = service_info upd.uuid, me
      Serverboards.Event.emit("service.updated", %{service: service}, ["service.update"])

      :ok
    else
      {:error, :not_found}
    end

  end

  def service_update_serverboard_real( serverboard, attributes, me) do
    import Ecto.Query

    case attributes do
      %{ services: services } ->
        current_uuids = services
          |> service_update_list_real(me)

        current_uuids
          |> Enum.map(fn uuid ->
            service_attach_real(serverboard, uuid, me)
          end)

        # now detach from non listed uuids
        Logger.info(inspect current_uuids)
        if (Enum.count current_uuids) == 0 do # remove all
          Repo.delete_all(
            from sc in ServerboardServiceModel,
            join: s in ServerboardModel,
              on: s.id == sc.serverboard_id,
           where: s.shortname == ^serverboard
           )
        else
          # remove only not updated
          ids_to_remove = Repo.all(
            from sc in ServerboardServiceModel,
             join: c in ServiceModel,
               on: c.id == sc.service_id,
             join: s in ServerboardModel,
               on: s.id == sc.serverboard_id,
             where: s.shortname == ^serverboard and
                    not (c.uuid in ^current_uuids),
            select: sc.id
          )
          Repo.delete_all(
             from sc_ in ServerboardServiceModel,
            where: sc_.id in ^ids_to_remove
            )
        end

      _ ->
        nil
    end
    :ok
  end

  defp service_add_real( uuid, attributes, me) do
    user = Serverboards.Auth.User.user_info( me, %{ email: me } )
    {:ok, service} = Repo.insert( %ServiceModel{
      uuid: uuid,
      name: attributes.name,
      type: attributes.type,
      creator_id: user.id,
      priority: attributes.priority,
      config: attributes.config
    } )

    Enum.map(attributes.tags, fn name ->
      Repo.insert( %ServiceTagModel{name: name, service_id: service.id} )
    end)
  end

  defp service_delete_real( service, _me) do
    import Ecto.Query
    # remove it when used inside any serverboard
    Repo.delete_all(
      from sc in ServerboardServiceModel,
      join: c in ServiceModel, on: c.id == sc.service_id,
      where: c.uuid == ^service
      )

      # 1 removed
    case Repo.delete_all( from c in ServiceModel, where: c.uuid == ^service ) do
      {1, _} -> :ok
      {0, _} -> {:error, :not_found}
    end
  end

  defp service_attach_real( serverboard, service, me ) do
    import Ecto.Query
    case Repo.one(
        from sc in ServerboardServiceModel,
          join: s in ServerboardModel,
            on: s.id == sc.serverboard_id,
          join: c in ServiceModel,
            on: c.id == sc.service_id,
          where: s.shortname == ^serverboard and
                 c.uuid == ^service,
          select: sc.id ) do
      nil ->
        serverboard_obj = Repo.get_by(ServerboardModel, shortname: serverboard)
        service_obj = Repo.get_by(ServiceModel, uuid: service)
        if Enum.all?([serverboard_obj, service_obj]) do
          {:ok, _serverboard_service} = Repo.insert( %ServerboardServiceModel{
            serverboard_id: serverboard_obj.id,
            service_id: service_obj.id
          } )
        else
          Logger.warn("Trying to attach invalid serverboard or service (#{serverboard} (#{inspect serverboard_obj}), #{service} (#{inspect service_obj}))")
        end

        {:ok, service} = service_info service_obj.uuid, me
        Serverboards.Event.emit("service.updated", %{service: service}, ["service.update"])
      _ ->  #  already in
        nil
    end
    :ok
  end

  defp service_detach_real(serverboard, service, me ) do
    import Ecto.Query

    to_remove = Repo.all(
      from sc in ServerboardServiceModel,
      join: s in ServerboardModel, on: s.id == sc.serverboard_id,
      join: c in ServiceModel, on: c.id == sc.service_id,
      where: c.uuid == ^service and s.shortname == ^serverboard,
      select: sc.id
     )

    Repo.delete_all(
      from sc_ in ServerboardServiceModel,
      where: sc_.id in ^to_remove )

    {:ok, service} = service_info service, me
    Serverboards.Event.emit("service.updated", %{service: service}, ["service.update"])
    :ok
  end

  # Updates all services in a give serverboard, or creates them. Returns list of uuids.
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
  Adds a service to a serverboard_shortname. Gives initial attributes.

  ## Example:

    iex> user = Test.User.system
    iex> {:ok, service} = service_add %{ "name" => "Generic", "type" => "generic" }, user
    iex> {:ok, info} = service_info service, user
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
    iex> services = service_list [], user
    iex> service_names = Enum.map(services, fn c -> c.name end )
    iex> Enum.member? service_names, "Generic A"
    true
    iex> Enum.member? service_names, "Generic B"
    true
    iex> Enum.member? service_names, "Generic C"
    true
    iex> services = service_list [type: "email"], user
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
  def service_list(filter, me) do
    import Ecto.Query
    query = if filter do
        Enum.reduce(filter, from(c in ServiceModel), fn kv, acc ->
          {k,v} = case kv do # decompose both tuples and lists / from RPC and from code.
            [k,v] -> {k,v}
            {k,v} -> {k,v}
          end
          k = case k do
            "name" -> :name
            "type" -> :type
            "serverboard" -> :serverboard
            other -> other
          end
          case k do
            :name ->
              acc |>
                where([c], c.name == ^v)
            :type ->
              acc |>
                where([c], c.type == ^v)
            :serverboard ->
              acc
                |> join(:inner,[c], sc in ServerboardServiceModel, sc.service_id == c.id)
                |> join(:inner,[c,sc], s in ServerboardModel, s.id == sc.serverboard_id and s.shortname == ^v)
                |> select([c,sc,s], c)
          end
        end)
      else
        ServiceModel
      end
    #Logger.info("#{inspect filter} #{inspect query}")
    Repo.all(query) |> Enum.map( &service_decorate(&1, me) )
  end

  @doc ~S"""
  Returns a service from databas eproperly decorated for external use, with
  fields and traits, and no internal data.
  """
  def service_decorate(service, me) do
    import Ecto.Query
    Logger.info("Get definition of #{inspect service}")
    service = service
          |> Map.put(:tags, Enum.map(Repo.all(Ecto.assoc(service, :tags)), &(&1.name)) )
          |> Map.put(:serverboards, Repo.all(
            from s in ServerboardModel,
            join: ss in ServerboardServiceModel,
              on: ss.serverboard_id == s.id,
           where: ss.service_id == ^service.id,
          select: s.shortname
            ))
    service = case service_catalog([type: service.type], me) do
      [] ->
        service
          |> Map.put(:fields, [])
          |> Map.put(:traits, [])
      [service_definition] ->
        fields = service_definition.fields |> Enum.map(fn f ->
          Map.put(f, :value, Map.get(service.config, f["name"], ""))
        end)
        service
          |> Map.put(:fields, fields)
          |> Map.put(:traits, service_definition.traits)
    end

    service |> Map.take(~w(tags serverboards config uuid priority name type fields traits)a)
  end

  @doc ~S"""
  Attaches existing services to a serverboard

  ## Example

    iex> user = Test.User.system
    iex> {:ok, service} = service_add %{ "name" => "Email server", "type" => "email" }, user
    iex> {:ok, _serverboard} = Serverboards.Serverboard.serverboard_add "SBDS-TST7", %{ "name" => "serverboards" }, user
    iex> :ok = service_attach "SBDS-TST7", service, user
    iex> services = service_list [serverboard: "SBDS-TST7"], user
    iex> Enum.map(services, fn c -> c.name end )
    ["Email server"]
    iex> :ok = service_delete service, user
    iex> services = service_list [serverboard: "SBDS-TST7"], user
    iex> Enum.map(services, fn c -> c.name end )
    []
  """
  def service_attach(serverboard, service, me) do
    EventSourcing.dispatch(:service, :attach_service, [serverboard, service], me.email)
    :ok
  end

  @doc ~S"""
  Detaches existing services from a serverboard

  ## Example

    iex> user = Test.User.system
    iex> {:ok, service} = service_add %{ "name" => "Email server", "type" => "email" }, user
    iex> {:ok, _serverboard} = Serverboards.Serverboard.serverboard_add "SBDS-TST9", %{ "name" => "serverboards" }, user
    iex> :ok = service_attach "SBDS-TST9", service, user
    iex> services = service_list [serverboard: "SBDS-TST9"], user
    iex> Enum.map(services, fn c -> c.name end )
    ["Email server"]
    iex> :ok = service_detach "SBDS-TST9", service, user
    iex> services = service_list [serverboard: "SBDS-TST9"], user
    iex> Enum.map(services, fn c -> c.name end )
    []
    iex> {:ok, info} = service_info service, user
    iex> info.name
    "Email server"

  """
  def service_detach(serverboard, service, me) do
    EventSourcing.dispatch(:service, :detach_service, [serverboard, service], me.email)
    :ok
  end

  @doc ~S"""
  Returns info about a given service, including tags, name, config and serverboards
  it is in.
  """
  def service_info(service, me) do
    import Ecto.Query

    case Repo.one( from c in ServiceModel, where: c.uuid == ^service, preload: :tags ) do
      nil -> {:error, :not_found}
      service ->
        service = service_decorate(service, me)
        {:ok, service }
    end
  end

  def service_update(service, operations, me) do
    changes = Enum.reduce(operations, %{}, fn op, acc ->
      Logger.debug("#{inspect op}")
      {opname, newval} = op
      opatom = case opname do
        "name" -> :name
        "priority" -> :priority
        "tags" -> :tags
        "config" -> :config
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

    iex> me = Test.User.system
    iex> service_def_list = service_catalog([], me)
    iex> Enum.count(service_def_list) >= 1
    true

    iex> me = Test.User.system
    iex> [specific_service_type] = service_catalog([type: "serverboards.test.auth/server" ], me)
    iex> specific_service_type.type
    "serverboards.test.auth/server"
    iex> specific_service_type.traits
    ["generic"]

    iex> me = Test.User.system
    iex> [] = service_catalog([traits: ["wrong", "traits"]], me)
    iex> service_def_list = service_catalog([traits: ["wrong", "traits", "next_matches", "generic"]], me)
    iex> Enum.count(service_def_list) >= 1
    true

  """
  def service_catalog(filter, _me) do
    Serverboards.Plugin.Registry.filter_component(type: "service")
      |> Enum.filter(fn service ->
        #Logger.debug("Match service catalog: #{inspect service}, #{inspect filter}")
        Enum.all?(filter, &match_service_filter(service, &1))
      end)
      |> Enum.map(fn service ->
        _c = %{
          name: service.name,
          type: service.id,
          fields: service.extra["fields"],
          traits: service.traits,
         }
      end)
  end
end
