require Logger
require EventSourcing

defmodule Serverboards.Service.Component do
  alias Serverboards.Service.Model
  alias Serverboards.Repo


  def setup_eventsourcing(es) do
    import EventSourcing

    subscribe :service, :add_component, fn attributes, me ->
      component_add_real(attributes.uuid, attributes, me)
    end
    subscribe :service, :delete_component, fn component, me ->
      component_delete_real(component, me)
    end
    # This attach_component is idempotent
    subscribe :service, :attach_component, fn [service, component], me ->
      component_attach_real(service, component, me)
    end
    subscribe :service, :detach_component, fn [service, component], me ->
      component_detach_real(service, component, me)
    end
    subscribe :service, :update_component, fn [component, operations], me ->
      component_update_real( component, operations, me)
    end
    subscribe :service, :update_service, fn [service, attributes], me ->
      component_update_service_real( service, attributes, me)
    end
  end

  defp component_update_real( uuid, operations, _me) do
    import Ecto.Query
    component = Repo.get_by(Model.Component, uuid: uuid)
    if component do
      tags = MapSet.new Map.get(operations, :tags, [])

      current_tags = Repo.all(from ct in Model.ComponentTag, where: ct.component_id == ^component.id, select: ct.name )
      current_tags = MapSet.new current_tags

      new_tags = MapSet.difference(tags, current_tags)
      expired_tags = MapSet.difference(current_tags, tags)

      if (Enum.count expired_tags) > 0 do
        expired_tags = MapSet.to_list expired_tags
        Repo.delete_all( from t in Model.ComponentTag, where: t.component_id == ^component.id and t.name in ^expired_tags )
      end
      Enum.map(new_tags, fn name ->
        Repo.insert( %Model.ComponentTag{name: name, component_id: component.id} )
      end)

      {:ok, upd} = Repo.update( Model.Component.changeset(
      component, operations
      ) )
      :ok
    else
      {:error, :not_found}
    end

  end

  def component_update_service_real( service, attributes, me) do
    import Ecto.Query

    case attributes do
      %{ components: components } ->
        current_uuids = components
          |> component_update_list_real(me)

        current_uuids
          |> Enum.map(fn uuid ->
            component_attach_real(service, uuid, me)
          end)

        # now detach from non listed uuids
        Logger.info(inspect current_uuids)
        if (Enum.count current_uuids) == 0 do # remove all
          Repo.delete_all(
            from sc in Model.ServiceComponent,
            join: s in Model.Service,
              on: s.id == sc.service_id,
           where: s.shortname == ^service
           )
        else
          # remove only not updated
          ids_to_remove = Repo.all(
            from sc in Model.ServiceComponent,
             join: c in Model.Component,
               on: c.id == sc.component_id,
             join: s in Model.Service,
               on: s.id == sc.service_id,
             where: s.shortname == ^service and
                    not (c.uuid in ^current_uuids),
            select: sc.id
          )
          Repo.delete_all(
             from sc_ in Model.ServiceComponent,
            where: sc_.id in ^ids_to_remove
            )
        end

      _ ->
        nil
    end
    :ok
  end

  defp component_add_real( uuid, attributes, me) do
    user = Serverboards.Auth.User.get_user( me )
    {:ok, component} = Repo.insert( %Model.Component{
      uuid: uuid,
      name: attributes.name,
      type: attributes.type,
      creator_id: user.id,
      priority: attributes.priority,
      config: attributes.config
    } )

    Enum.map(attributes.tags, fn name ->
      Repo.insert( %Model.ComponentTag{name: name, component_id: component.id} )
    end)
  end

  defp component_delete_real( component, _me) do
    import Ecto.Query
    #user = Serverboards.Auth.User.get_user( me )

    # remove it when used inside any service
    Repo.delete_all(
      from sc in Model.ServiceComponent,
      join: c in Model.Component, on: c.id == sc.component_id,
      where: c.uuid == ^component
      )

      # 1 removed
    case Repo.delete_all( from c in Model.Component, where: c.uuid == ^component ) do
      {1, _} -> :ok
      {0, _} -> {:error, :not_found}
    end
  end

  defp component_attach_real( service, component, me ) do
    import Ecto.Query
    case Repo.one(
        from sc in Model.ServiceComponent,
          join: s in Model.Service,
            on: s.id == sc.service_id,
          join: c in Model.Component,
            on: c.id == sc.component_id,
          where: s.shortname == ^service and
                 c.uuid == ^component,
          select: sc.id ) do
      nil ->
        user = Serverboards.Auth.User.get_user( me )
        service_obj = Repo.get_by(Model.Service, shortname: service)
        component_obj = Repo.get_by(Model.Component, uuid: component)
        if Enum.all?([service_obj, component_obj]) do
          {:ok, _service_component} = Repo.insert( %Model.ServiceComponent{
            service_id: service_obj.id,
            component_id: component_obj.id
          } )
        else
          Logger.warn("Trying to attach invalid service or component (#{service} (#{inspect service_obj}), #{component} (#{inspect component_obj}))")
        end
      _ ->  #  already in
        nil
    end
    :ok
  end

  defp component_detach_real(service, component, _me ) do
    import Ecto.Query

    to_remove = Repo.all(
      from sc in Model.ServiceComponent,
      join: s in Model.Service, on: s.id == sc.service_id,
      join: c in Model.Component, on: c.id == sc.component_id,
      where: c.uuid == ^component and s.shortname == ^service,
      select: sc.id
     )

    Repo.delete_all(
      from sc_ in Model.ServiceComponent,
      where: sc_.id in ^to_remove )

    :ok
  end

  # Updates all components in a give service, or creates them. Returns list of uuids.
  defp component_update_list_real( [], _me), do: []
  defp component_update_list_real( [ attributes | rest ], me) do
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

        component_add_real( uuid, attributes, me )
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

        component_update_real( uuid, nattributes, me )
        uuid
      end
    [uuid | component_update_list_real(rest, me)]
  end

  @doc ~S"""
  Adds a component to a service_shortname. Gives initial attributes.

  ## Example:

    iex> user = Serverboards.Auth.User.get_user("dmoreno@serverboards.io")
    iex> {:ok, component} = component_add %{ "name" => "Generic", "type" => "generic" }, user
    iex> {:ok, info} = component_info component, user
    iex> info.priority
    50
    iex> info.name
    "Generic"
    iex> component_delete component, user
    :ok
  """
  def component_add(attributes, me) do
    attributes = %{
      uuid: UUID.uuid4,
      name: attributes["name"],
      type: attributes["type"],
      priority: Map.get(attributes,"priority", 50),
      tags: Map.get(attributes,"tags", []),
      config: Map.get(attributes,"config", %{}),
    }

    EventSourcing.dispatch(:service, :add_component, attributes, me.email)
    {:ok, attributes.uuid}
  end

  def component_delete(component, me) do
    EventSourcing.dispatch(:service, :delete_component, component, me.email)
    :ok
  end

  @doc ~S"""
  Lists all components, optional filter

  ## Example

    iex> user = Serverboards.Auth.User.get_user("dmoreno@serverboards.io")
    iex> {:ok, _component_a} = component_add %{ "name" => "Generic A", "type" => "generic" }, user
    iex> {:ok, _component_b} = component_add %{ "name" => "Generic B", "type" => "email" }, user
    iex> {:ok, _component_c} = component_add %{ "name" => "Generic C", "type" => "generic" }, user
    iex> components = component_list [], user
    iex> component_names = Enum.map(components, fn c -> c.name end )
    iex> Enum.member? component_names, "Generic A"
    true
    iex> Enum.member? component_names, "Generic B"
    true
    iex> Enum.member? component_names, "Generic C"
    true
    iex> components = component_list [type: "email"], user
    iex> component_names = Enum.map(components, fn c -> c.name end )
    iex> require Logger
    iex> Logger.info(inspect component_names)
    iex> not Enum.member? component_names, "Generic A"
    true
    iex> Enum.member? component_names, "Generic B"
    true
    iex> not Enum.member? component_names, "Generic C"
    true

  """
  def component_list(filter, _me) do
    import Ecto.Query
    query = if filter do
        Enum.reduce(filter, from(c in Model.Component), fn kv, acc ->
          {k,v} = case kv do # decompose both tuples and lists / from RPC and from code.
            [k,v] -> {k,v}
            {k,v} -> {k,v}
          end
          k = case k do
            "name" -> :name
            "type" -> :type
            "service" -> :service
            other -> other
          end
          case k do
            :name ->
              acc |>
                where([c], c.name == ^v)
            :type ->
              acc |>
                where([c], c.type == ^v)
            :service ->
              acc
                |> join(:inner,[c], sc in Model.ServiceComponent, sc.component_id == c.id)
                |> join(:inner,[c,sc], s in Model.Service, s.id == sc.service_id and s.shortname == ^v)
                |> select([c,sc,s], c)
          end
        end)
      else
        Model.Component
      end
    #Logger.info("#{inspect filter} #{inspect query}")
    Repo.all(query)
  end

  @doc ~S"""
  Attaches existing components to a service

  ## Example

    iex> user = Serverboards.Auth.User.get_user("dmoreno@serverboards.io")
    iex> {:ok, component} = component_add %{ "name" => "Email server", "type" => "email" }, user
    iex> {:ok, _service} = Serverboards.Service.Service.service_add "SBDS-TST7", %{ "name" => "serverboards" }, user
    iex> :ok = component_attach "SBDS-TST7", component, user
    iex> components = component_list [service: "SBDS-TST7"], user
    iex> Enum.map(components, fn c -> c.name end )
    ["Email server"]
    iex> :ok = component_delete component, user
    iex> components = component_list [service: "SBDS-TST7"], user
    iex> Enum.map(components, fn c -> c.name end )
    []
  """
  def component_attach(service, component, me) do
    EventSourcing.dispatch(:service, :attach_component, [service, component], me.email)
    :ok
  end

  @doc ~S"""
  Attaches existing components from a service

  ## Example

    iex> user = Serverboards.Auth.User.get_user("dmoreno@serverboards.io")
    iex> {:ok, component} = component_add %{ "name" => "Email server", "type" => "email" }, user
    iex> {:ok, _service} = Serverboards.Service.Service.service_add "SBDS-TST9", %{ "name" => "serverboards" }, user
    iex> :ok = component_attach "SBDS-TST9", component, user
    iex> components = component_list [service: "SBDS-TST9"], user
    iex> Enum.map(components, fn c -> c.name end )
    ["Email server"]
    iex> :ok = component_detach "SBDS-TST9", component, user
    iex> components = component_list [service: "SBDS-TST9"], user
    iex> Enum.map(components, fn c -> c.name end )
    []
    iex> {:ok, info} = component_info component, user
    iex> info.name
    "Email server"

  """
  def component_detach(service, component, me) do
    EventSourcing.dispatch(:service, :detach_component, [service, component], me.email)
    :ok
  end

  def component_info(component, me) do
    import Ecto.Query

    case Repo.one( from c in Model.Component, where: c.uuid == ^component, preload: :tags ) do
      nil -> {:error, :not_found}
      component ->
        {:ok, %{ component | tags: Enum.map(component.tags, &(&1.name)) } }
    end
  end

  def component_update(component, operations, me) do
    changes = Enum.reduce(operations, %{}, fn op, acc ->
      Logger.debug("#{inspect op}")
      {opname, newval} = op
      opatom = case opname do
        "name" -> :name
        "priority" -> :priority
        "tags" -> :tags
        e ->
          Logger.error("Unknown operation #{inspect e}. Failing.")
          raise Exception, "Unknown operation updating component #{component}: #{inspect e}. Failing."
        end
        if opatom do
          Map.put acc, opatom, newval
        else
          acc
        end
      end)

    EventSourcing.dispatch(:service, :update_component, [component, changes], me.email)

    {:ok, component }
  end

  def component_list_available(filter, me) do
    Serverboards.Plugin.Registry.filter_component(type: "component")
      |> Enum.map(fn component ->
        c = %{
          name: component.name,
          type: component.plugin.id <> "/" <> component.id,
          fields: component.extra["fields"]
         }
      end)
  end
end
