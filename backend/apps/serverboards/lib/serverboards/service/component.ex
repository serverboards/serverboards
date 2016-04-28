require Logger
require EventSourcing

defmodule Serverboards.Service.Component do
  alias Serverboards.Service.Model
  alias Serverboards.Repo


  def setup_eventsourcing(es) do
    import EventSourcing

    subscribe :service, :add_component, fn {attributes, me} ->
      user = Serverboards.Auth.User.get_user( me )
      {:ok, component} = Repo.insert( %Model.Component{
        name: attributes.name,
        type: attributes.type,
        creator_id: user.id,
        priority: attributes.priority
      } )
      component
    end, name: :component
    subscribe :service, :delete_component, fn {component, _me} ->
      import Ecto.Query
      #user = Serverboards.Auth.User.get_user( me )
      # 1 removed
      {1, _} = Repo.delete_all( from c in Model.Component, where: c.id == ^component )
      :ok
    end
    subscribe :service, :attach_component, fn {service, component_id, me} ->
      user = Serverboards.Auth.User.get_user( me )
      service = Repo.get_by!(Model.Service, shortname: service)
      #component = Repo.get_by!(Model.Component, id: component)
      {:ok, _service_component} = Repo.insert( %Model.ServiceComponent{
        service_id: service.id,
        component_id: component_id
      } )
      :ok
    end
  end

  @doc ~S"""
  Adds a component to a service_shortname. Gives initial attributes.

  ## Example:

    iex> user = Serverboards.Auth.User.get_user("dmoreno@serverboards.io")
    iex> {:ok, component} = component_add %{ "name" => "Generic", "type" => "generic" }, user
    iex> component.priority
    50
    iex> component.name
    "Generic"
    iex> component_delete component.id, user
    :ok
  """
  def component_add(attributes, me) do
    attributes = %{
      name: attributes["name"],
      type: attributes["type"],
      priority: Map.get(attributes,"priority", 50)
    }

    {:ok, EventSourcing.dispatch(:service, :add_component, {attributes, me.email}).component}
  end

  def component_delete(component, me) do
    EventSourcing.dispatch(:service, :delete_component, {component, me.email})
    :ok
  end

  @doc ~S"""
  Lists all components, optional filter

  ## Example

    iex> user = Serverboards.Auth.User.get_user("dmoreno@serverboards.io")
    iex> {:ok, _component_a} = component_add %{ "name" => "Generic A", "type" => "generic" }, user
    iex> {:ok, _component_b} = component_add %{ "name" => "Generic B", "type" => "email" }, user
    iex> {:ok, _component_c} = component_add %{ "name" => "Generic C", "type" => "generic" }, user
    iex> components = component_list
    iex> component_names = Enum.map(components, fn c -> c.name end )
    iex> Enum.member? component_names, "Generic A"
    true
    iex> Enum.member? component_names, "Generic B"
    true
    iex> Enum.member? component_names, "Generic C"
    true
    iex> components = component_list type: "email"
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
  def component_list(filter \\ []) do
    import Ecto.Query
    query = if filter do
        Enum.reduce(filter, from(c in Model.Component), fn {k, v}, acc ->
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
    iex> {:ok, service} = Serverboards.Service.Service.service_add "SBDS-TST7", %{ "name" => "serverboards" }, user
    iex> :ok = component_attach "SBDS-TST7", component.id, user
    iex> components = component_list service: "SBDS-TST7"
    iex> Enum.map(components, fn c -> c.name end )
    ["Email server"]
    iex> :ok = component_delete component.id, user
    iex> components = component_list service: "SBDS-TST7"
    iex> Enum.map(components, fn c -> c.name end )
    []
  """
  def component_attach(service, component, me) do
    EventSourcing.dispatch(:service, :attach_component, {service, component, me.email})
    :ok
  end
end
