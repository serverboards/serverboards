require Logger

defmodule ServiceTest do
  use ExUnit.Case
  @moduletag :capture_log

  doctest Serverboards.Service.Service, import: true
  doctest Serverboards.Service.Component, import: true

  setup_all do
    {:ok, agent } = Agent.start_link fn -> %{} end
    Serverboards.MOM.Channel.subscribe( :client_events, fn %{ payload: msg } ->
      Agent.update agent, fn status ->
        Logger.info("New message to client #{inspect msg}. #{inspect agent} ")
        Map.put( status, msg.type, Map.get(status, msg.type, []) ++ [msg] )
      end
    end )
    {:ok, %{ agent: agent} }
  end

  def check_if_event_on_service(agent, event, shortname) do
    Agent.get agent, fn status ->
      deleted =Map.get(status,event,[])
      Logger.debug("Check if #{shortname} in #{inspect deleted}")
      ret = Enum.any? deleted, fn event ->
        if Map.get(event.data, :service) do
          event.data.service.shortname == shortname
        else
          event.data.shortname == shortname
        end
      end
    end
  end


  test "Service lifecycle", %{ agent: agent } do
    import Serverboards.Service.Service

    user = Serverboards.Auth.User.get_user("dmoreno@serverboards.io")
    {:ok, "SBDS-TST3"} = service_add "SBDS-TST3", %{ "name" => "serverboards" }, user
    assert check_if_event_on_service(agent, "service.added", "SBDS-TST3")

    :ok = service_update "SBDS-TST3", %{ "name" => "Serverboards" }, user
    assert check_if_event_on_service(agent, "service.updated", "SBDS-TST3")

    {:ok, info} = service_info "SBDS-TST3", user
    assert info.name == "Serverboards"

    :ok = service_delete "SBDS-TST3", user
    assert check_if_event_on_service(agent, "service.deleted", "SBDS-TST3")

    assert {:error, :not_found} == service_info "SBDS-TST3", user
  end

  test "Update services tags" do
    import Serverboards.Service.Service

    user = Serverboards.Auth.User.get_user("dmoreno@serverboards.io")
    {:error, :not_found } = service_info "SBDS-TST5", user

    {:ok, "SBDS-TST5"} = service_add "SBDS-TST5", %{ "name" => "serverboards" }, user
    {:ok, info } = service_info "SBDS-TST5", user
    assert info.tags == []

    :ok = service_update "SBDS-TST5", %{ "tags" => ~w(tag1 tag2 tag3)}, user
    {:ok, info } = service_info "SBDS-TST5", user
    Logger.debug("Current service info: #{inspect info}")
    assert Enum.member? info.tags, "tag1"
    assert Enum.member? info.tags, "tag2"
    assert Enum.member? info.tags, "tag3"
    assert not (Enum.member? info.tags, "tag4")

    service_update "SBDS-TST5", %{ "tags" => ~w(tag1 tag2 tag4) }, user
    {:ok, info } = service_info "SBDS-TST5", user
    assert Enum.member? info.tags, "tag1"
    assert Enum.member? info.tags, "tag2"
    assert not (Enum.member? info.tags, "tag3")
    assert Enum.member? info.tags, "tag4"

    :ok = service_delete "SBDS-TST5", user
  end

  test "Services as a client", %{ agent: agent } do
    {:ok, client} = Test.Client.start_link as: "dmoreno@serverboards.io"

    {:ok, dir} = Test.Client.call client, "dir", []
    Logger.debug("Known methods: #{inspect dir}")
    assert Enum.member? dir, "service.list"
    assert Enum.member? dir, "service.add"
    assert Enum.member? dir, "service.delete"
    assert Enum.member? dir, "service.info"

    #{:ok, json} = JSON.encode(Test.Client.debug client)
    #Logger.info("Debug information: #{json}")

    {:ok, l} = Test.Client.call client, "service.list", []
    Logger.info("Got services: #{inspect l}")
    assert (Enum.count l) >= 0

    {:ok, "SBDS-TST8"} = Test.Client.call client, "service.add", [
      "SBDS-TST8",
      %{
        "name" => "Serverboards test",
        "tags" => ["tag1", "tag2"],
        "components" => [
          %{ "type" => "test", "name" => "main web", "config" => %{ "url" => "http://serverboards.io" } },
          %{ "type" => "test", "name" => "blog", "config" => %{ "url" => "http://serverboards.io/blog" } },
        ]
      }
    ]
    assert check_if_event_on_service(agent, "service.added", "SBDS-TST8")
    deleted=check_if_event_on_service(agent, "service.deleted", "SBDS-TST8")
    Logger.info("At service deleted? #{deleted}")
    assert not deleted

    {:ok, cl} = Test.Client.call client, "service.info", ["SBDS-TST8"]
    Logger.info("Info from service #{inspect cl}")
    {:ok, json} = JSON.encode(cl)
    assert not String.contains? json, "__"
    assert (hd cl["components"])["name"] == "main web"
    assert (hd (tl cl["components"]))["name"] == "blog"

    {:ok, cls} = Test.Client.call client, "service.list", []
    Logger.info("Info from service #{inspect cls}")
    {:ok, json} = JSON.encode(cls)
    assert not String.contains? json, "__"
    assert Enum.any?(cls, &(&1["shortname"] == "SBDS-TST8"))


    {:ok, component} = Test.Client.call client, "component.add", %{ "tags" => ["email","test"], "type" => "email", "name" => "Email" }
    Test.Client.call client, "component.attach", ["SBDS-TST8", component]
    Test.Client.call client, "component.info", [component]
    Test.Client.call client, "component.list", []
    Test.Client.call client, "component.list", [["type","email"]]

    Test.Client.call client, "service.update", [
      "SBDS-TST8",
      %{
        "components" => [
          %{ "uuid" => component, "name" => "new name" }
        ]
      }
    ]
    {:ok, info} = Test.Client.call client, "component.info", [component]
    assert info.name == "new name"

    Test.Client.call client, "component.delete", [component]
    {:ok, components} = Test.Client.call client, "component.list", [["type","email"]]
    assert not (Enum.any? components, &(&1["uuid"] == component))


    Test.Client.call client, "service.delete", ["SBDS-TST8"]

    assert check_if_event_on_service(agent, "service.added", "SBDS-TST8")
    assert check_if_event_on_service(agent, "service.deleted", "SBDS-TST8")


    Test.Client.stop(client)
  end


  test "Tags into components" do
    import Serverboards.Service.{Service, Component}

    user = Serverboards.Auth.User.get_user("dmoreno@serverboards.io")
    {:ok, component } = component_add %{ "name" => "Test component", "tags" => ~w(tag1 tag2 tag3), "type" => "email" }, user
    {:ok, info } = component_info component, user
    assert info.tags == ["tag1", "tag2", "tag3"]

    component_update component, %{ "tags" => ["a","b","c"] }, user
    {:ok, info } = component_info component, user
    assert info.tags == ["a", "b", "c"]

    component_delete component, user
  end
end
