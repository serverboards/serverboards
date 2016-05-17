require Logger
require EventSourcing

defmodule Serverboards.Service do
end

defmodule Serverboards.Service.Component do
  alias Serverboards.Service.Model.Component, as: ComponentModel
  alias Serverboards.Service.Model.ComponentTag, as: ComponentTagModel
  alias Serverboards.Serverboard.Model.Serverboard, as: ServerboardModel
  alias Serverboards.Serverboard.Model.ServerboardComponent, as: ServerboardComponentModel
  alias Serverboards.Repo

  def start_link(options) do
    {:ok, es} = EventSourcing.start_link name: :component
    {:ok, rpc} = Serverboards.Service.RPC.start_link

    EventSourcing.Model.subscribe :component, :component, Serverboards.Repo

    setup_eventsourcing(es)

    {:ok, es}
  end

  def setup_eventsourcing(es) do
    import EventSourcing

    subscribe es, :add_component, fn attributes, me ->
      component_add_real(attributes.uuid, attributes, me)
    end
    subscribe es, :delete_component, fn component, me ->
      component_delete_real(component, me)
    end
    # This attach_component is idempotent
    subscribe es, :attach_component, fn [serverboard, component], me ->
      component_attach_real(serverboard, component, me)
    end
    subscribe es, :detach_component, fn [serverboard, component], me ->
      component_detach_real(serverboard, component, me)
    end
    subscribe es, :update_component, fn [component, operations], me ->
      component_update_real( component, operations, me)
    end

    # this is at a serverboard, not at a service, updates components into that serverboard
    subscribe :serverboard, :update_serverboard, fn [serverboard, attributes], me ->
      component_update_serverboard_real( serverboard, attributes, me)
    end
  end

  defp component_update_real( uuid, operations, _me) do
    import Ecto.Query
    component = Repo.get_by(ComponentModel, uuid: uuid)
    if component do
      tags = MapSet.new Map.get(operations, :tags, [])

      current_tags = Repo.all(from ct in ComponentTagModel, where: ct.component_id == ^component.id, select: ct.name )
      current_tags = MapSet.new current_tags

      new_tags = MapSet.difference(tags, current_tags)
      expired_tags = MapSet.difference(current_tags, tags)

      if (Enum.count expired_tags) > 0 do
        expired_tags = MapSet.to_list expired_tags
        Repo.delete_all( from t in ComponentTagModel, where: t.component_id == ^component.id and t.name in ^expired_tags )
      end
      Enum.map(new_tags, fn name ->
        Repo.insert( %ComponentTagModel{name: name, component_id: component.id} )
      end)

      {:ok, upd} = Repo.update( ComponentModel.changeset(
      component, operations
      ) )
      :ok
    else
      {:error, :not_found}
    end

  end

  def component_update_serverboard_real( serverboard, attributes, me) do
    import Ecto.Query

    case attributes do
      %{ components: components } ->
        current_uuids = components
          |> component_update_list_real(me)

        current_uuids
          |> Enum.map(fn uuid ->
            component_attach_real(serverboard, uuid, me)
          end)

        # now detach from non listed uuids
        Logger.info(inspect current_uuids)
        if (Enum.count current_uuids) == 0 do # remove all
          Repo.delete_all(
            from sc in ServerboardComponentModel,
            join: s in ServerboardModel,
              on: s.id == sc.serverboard_id,
           where: s.shortname == ^serverboard
           )
        else
          # remove only not updated
          ids_to_remove = Repo.all(
            from sc in ServerboardComponentModel,
             join: c in ComponentModel,
               on: c.id == sc.component_id,
             join: s in ServerboardModel,
               on: s.id == sc.serverboard_id,
             where: s.shortname == ^serverboard and
                    not (c.uuid in ^current_uuids),
            select: sc.id
          )
          Repo.delete_all(
             from sc_ in ServerboardComponentModel,
            where: sc_.id in ^ids_to_remove
            )
        end

      _ ->
        nil
    end
    :ok
  end

  defp component_add_real( uuid, attributes, me) do
    user = Serverboards.Auth.User.user_info( me, %{ email: me } )
    {:ok, component} = Repo.insert( %ComponentModel{
      uuid: uuid,
      name: attributes.name,
      type: attributes.type,
      creator_id: user.id,
      priority: attributes.priority,
      config: attributes.config
    } )

    Enum.map(attributes.tags, fn name ->
      Repo.insert( %ComponentTagModel{name: name, component_id: component.id} )
    end)
  end

  defp component_delete_real( component, _me) do
    import Ecto.Query
    # remove it when used inside any serverboard
    Repo.delete_all(
      from sc in ServerboardComponentModel,
      join: c in ComponentModel, on: c.id == sc.component_id,
      where: c.uuid == ^component
      )

      # 1 removed
    case Repo.delete_all( from c in ComponentModel, where: c.uuid == ^component ) do
      {1, _} -> :ok
      {0, _} -> {:error, :not_found}
    end
  end

  defp component_attach_real( serverboard, component, me ) do
    import Ecto.Query
    case Repo.one(
        from sc in ServerboardComponentModel,
          join: s in ServerboardModel,
            on: s.id == sc.serverboard_id,
          join: c in ComponentModel,
            on: c.id == sc.component_id,
          where: s.shortname == ^serverboard and
                 c.uuid == ^component,
          select: sc.id ) do
      nil ->
        serverboard_obj = Repo.get_by(ServerboardModel, shortname: serverboard)
        component_obj = Repo.get_by(ComponentModel, uuid: component)
        if Enum.all?([serverboard_obj, component_obj]) do
          {:ok, _serverboard_component} = Repo.insert( %ServerboardComponentModel{
            serverboard_id: serverboard_obj.id,
            component_id: component_obj.id
          } )
        else
          Logger.warn("Trying to attach invalid serverboard or component (#{serverboard} (#{inspect serverboard_obj}), #{component} (#{inspect component_obj}))")
        end
      _ ->  #  already in
        nil
    end
    :ok
  end

  defp component_detach_real(serverboard, component, _me ) do
    import Ecto.Query

    to_remove = Repo.all(
      from sc in ServerboardComponentModel,
      join: s in ServerboardModel, on: s.id == sc.serverboard_id,
      join: c in ComponentModel, on: c.id == sc.component_id,
      where: c.uuid == ^component and s.shortname == ^serverboard,
      select: sc.id
     )

    Repo.delete_all(
      from sc_ in ServerboardComponentModel,
      where: sc_.id in ^to_remove )

    :ok
  end

  # Updates all components in a give serverboard, or creates them. Returns list of uuids.
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
  Adds a component to a serverboard_shortname. Gives initial attributes.

  ## Example:

    iex> user = Serverboards.Test.User.system
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

    EventSourcing.dispatch(:component, :add_component, attributes, me.email)
    {:ok, attributes.uuid}
  end

  def component_delete(component, me) do
    EventSourcing.dispatch(:component, :delete_component, component, me.email)
    :ok
  end

  @doc ~S"""
  Lists all components, optional filter

  ## Example

    iex> user = Serverboards.Test.User.system
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
        Enum.reduce(filter, from(c in ComponentModel), fn kv, acc ->
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
                |> join(:inner,[c], sc in ServerboardComponentModel, sc.component_id == c.id)
                |> join(:inner,[c,sc], s in ServerboardModel, s.id == sc.serverboard_id and s.shortname == ^v)
                |> select([c,sc,s], c)
          end
        end)
      else
        ComponentModel
      end
    #Logger.info("#{inspect filter} #{inspect query}")
    Repo.all(query)
  end

  @doc ~S"""
  Attaches existing components to a serverboard

  ## Example

    iex> user = Serverboards.Test.User.system
    iex> {:ok, component} = component_add %{ "name" => "Email server", "type" => "email" }, user
    iex> {:ok, _serverboard} = Serverboards.Serverboard.serverboard_add "SBDS-TST7", %{ "name" => "serverboards" }, user
    iex> :ok = component_attach "SBDS-TST7", component, user
    iex> components = component_list [serverboard: "SBDS-TST7"], user
    iex> Enum.map(components, fn c -> c.name end )
    ["Email server"]
    iex> :ok = component_delete component, user
    iex> components = component_list [serverboard: "SBDS-TST7"], user
    iex> Enum.map(components, fn c -> c.name end )
    []
  """
  def component_attach(serverboard, component, me) do
    EventSourcing.dispatch(:component, :attach_component, [serverboard, component], me.email)
    :ok
  end

  @doc ~S"""
  Attaches existing components from a serverboard

  ## Example

    iex> user = Serverboards.Test.User.system
    iex> {:ok, component} = component_add %{ "name" => "Email server", "type" => "email" }, user
    iex> {:ok, _serverboard} = Serverboards.Serverboard.serverboard_add "SBDS-TST9", %{ "name" => "serverboards" }, user
    iex> :ok = component_attach "SBDS-TST9", component, user
    iex> components = component_list [serverboard: "SBDS-TST9"], user
    iex> Enum.map(components, fn c -> c.name end )
    ["Email server"]
    iex> :ok = component_detach "SBDS-TST9", component, user
    iex> components = component_list [serverboard: "SBDS-TST9"], user
    iex> Enum.map(components, fn c -> c.name end )
    []
    iex> {:ok, info} = component_info component, user
    iex> info.name
    "Email server"

  """
  def component_detach(serverboard, component, me) do
    EventSourcing.dispatch(:component, :detach_component, [serverboard, component], me.email)
    :ok
  end

  def component_info(component, me) do
    import Ecto.Query

    case Repo.one( from c in ComponentModel, where: c.uuid == ^component, preload: :tags ) do
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

    EventSourcing.dispatch(:component, :update_component, [component, changes], me.email)

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
