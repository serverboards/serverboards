require Logger

defmodule Serverboards.Service.Service do
  import Ecto.Changeset
  import Ecto.Query

  alias Serverboards.Repo
  alias Serverboards.Service.Model


  def start_link(options) do
    alias Serverboards.Service.{Component, Service}

    {:ok, es} = EventSourcing.start_link name: :service
    {:ok, rpc} = Serverboards.Service.RPC.start_link

    EventSourcing.subscribe :service, :debug_full

    Component.setup_eventsourcing(es)
    Service.setup_eventsourcing(es)

    {:ok, es}
  end

  def setup_eventsourcing(es) do
    EventSourcing.subscribe :service, :add_service, fn attributes ->
      {:ok, service} = Repo.insert( Model.Service.changeset(%Model.Service{}, attributes) )

      Enum.map(Map.get(attributes, :tags, []), fn name ->
        Repo.insert( %Model.ServiceTag{name: name, service_id: service.id} )
      end)

      service.shortname
    end, name: :service

    EventSourcing.subscribe :service, :update_service, fn {shortname, operations} ->
      import Ecto.Query
      # update tags
      service = Repo.get_by!(Model.Service, shortname: shortname)

      tags = MapSet.new Map.get(operations, :tags, [])

      current_tags = Repo.all(from st in Model.ServiceTag, where: st.service_id == ^service.id, select: st.name )
      current_tags = MapSet.new current_tags

      new_tags = MapSet.difference(tags, current_tags)
      expired_tags = MapSet.difference(current_tags, tags)

      Logger.debug("Update service tags. Current #{inspect current_tags}, add #{inspect new_tags}, remove #{inspect expired_tags}")

      if (Enum.count expired_tags) > 0 do
        expired_tags = MapSet.to_list expired_tags
        Repo.delete_all( from t in Model.ServiceTag, where: t.service_id == ^service.id and t.name in ^expired_tags )
      end
      Enum.map(new_tags, fn name ->
        Repo.insert( %Model.ServiceTag{name: name, service_id: service.id} )
      end)

      {:ok, upd} = Repo.update( Model.Service.changeset(
        service, operations
      ) )
      :ok
    end, name: :service

    EventSourcing.subscribe :service, :delete_service, fn shortname ->
      Repo.delete_all( from s in Model.Service, where: s.shortname == ^shortname )
    end
  end

  @doc ~S"""
  Creates a new service given the shortname, attributes and creator_id

  Attributes is a Map with the service attributes (strings, not atoms) All are optional.

  Attributes:
  * name -- Service name
  * description -- Long description
  * priority -- Used for sorting, increasing.
  * tags -- List of tags to apply.

  ## Example

    iex> user = Serverboards.Auth.User.get_user("dmoreno@serverboards.io")
    iex> {:ok, "SBDS-TST1"} = service_add "SBDS-TST1", %{ "name" => "serverboards" }, user
    iex> {:ok, info} = service_info "SBDS-TST1", user
    iex> info.name
    "serverboards"
    iex> service_delete "SBDS-TST1", user
    :ok

  """
  def service_add(shortname, attributes, me) do
    %{ service: service } = EventSourcing.dispatch :service, :add_service, %{
      shortname: shortname,
      creator_id: me.id,
      name: Map.get(attributes,"name", shortname),
      description: Map.get(attributes, "description", ""),
      priority: Map.get(attributes, "priority", 50),
      tags: Map.get(attributes, "tags", [])
    }
    {:ok, service}
  end



  @doc ~S"""
  Updates a service by id or shortname

  ## Example:

    iex> user = Serverboards.Auth.User.get_user("dmoreno@serverboards.io")
    iex> {:ok, "SBDS-TST2"} = service_add "SBDS-TST2", %{ "name" => "serverboards" }, user
    iex> :ok = service_update "SBDS-TST2", %{ "name" => "Serverboards" }, user
    iex> {:ok, info} = service_info "SBDS-TST2", user
    iex> info.name
    "Serverboards"
    iex> service_delete "SBDS-TST2", user
    :ok

  """
  def service_update(service, operations, me) when is_map(service) do
    #Logger.debug("service_update #{inspect {service.shortname, operations, me}}, service id #{service.id}")

    # Calculate changes on service itself.
    changes = Enum.reduce(operations, %{}, fn op, acc ->
      Logger.debug("#{inspect op}")
      {opname, newval} = op
      opatom = case opname do
        "name" -> :name
        "description" -> :description
        "priority" -> :priority
        "tags" -> :tags
        e ->
          Logger.error("Unknown operation #{inspect e}. Failing.")
          raise Exception, "Unknown operation updating service #{service.shortname}: #{inspect e}. Failing."
        end
        if opatom do
          Map.put acc, opatom, newval
        else
          acc
        end
      end)

    EventSourcing.dispatch(:service, :update_service, {service.shortname, changes}).service
  end
  def service_update(service_id, operations, me) when is_number(service_id) do
    service_update(Repo.get_by(Model.Service, [id: service_id]), operations, me)
  end
  def service_update(servicename, operations, me) when is_binary(servicename) do
    service_update(Repo.get_by(Model.Service, [shortname: servicename]), operations, me)
  end

  @doc ~S"""
  Deletes a service by id or name
  """
  def service_delete(%Model.Service{ shortname: shortname } = service, _me) do
    EventSourcing.dispatch(:service, :delete_service, shortname)
    :ok
  end
  def service_delete(service_id, me) when is_number(service_id) do
    service_delete( Repo.get_by(Model.Service, [id: service_id]), me )
  end
  def service_delete(service_shortname, me) when is_binary(service_shortname) do
    service_delete( Repo.get_by(Model.Service, [shortname: service_shortname]), me )
  end

  @doc ~S"""
  Returns the information of a service by id or name
  """
  def service_info(service_id, _me) when is_number(service_id) do
    case Repo.one( from( s in Model.Service, where: s.id == ^service_id, preload: :tags ) ) do
      nil -> {:error, :not_found}
      service ->
        service = %{ service | tags: Enum.map(service.tags, fn t -> t.name end)}
        {:ok, service }
    end
  end
  def service_info(service_shortname, _me) when is_binary(service_shortname) do
    case Repo.one( from(s in Model.Service, where: s.shortname == ^service_shortname, preload: :tags ) ) do
      nil -> {:error, :not_found}
      service ->
        service = %{ service | tags: Enum.map(service.tags, fn t -> t.name end)}
        {:ok, service }
    end
  end

  @doc ~S"""
  Returns a list with all services and its information

  ## Example

    iex> require Logger
    iex> user = Serverboards.Auth.User.get_user("dmoreno@serverboards.io")
    iex> {:ok, l} = service_list user.id
    iex> is_list(l) # may be empty or has something from before, but lists
    true
    iex> {:ok, "SBDS-TST4"} = service_add "SBDS-TST4", %{ "name" => "serverboards" }, user
    iex> {:ok, l} = service_list user.id
    iex> Logger.debug(inspect l)
    iex> Enum.any? l, &(&1["shortname"]=="SBDS-TST4") # exists in the list?
    true
    iex> service_delete "SBDS-TST4", user
    :ok

  """
  def service_list(_me) do
    {:ok, Enum.map(Serverboards.Repo.all(Serverboards.Service.Model.Service), &Serverboards.Utils.clean_struct(&1)) }
  end

end
