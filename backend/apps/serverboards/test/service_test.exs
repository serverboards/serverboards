require Logger

defmodule ServerboardTest do
  use ExUnit.Case
  @moduletag :capture_log

  doctest Serverboards.Serverboard, import: true
  doctest Serverboards.Service.Component, import: true

  setup_all do
    {:ok, agent } = Agent.start_link fn -> %{} end
    Serverboards.MOM.Channel.subscribe( :client_events, fn %{ payload: msg } ->
      Agent.update agent, fn status ->
        Logger.info("New message to client #{inspect msg}. #{inspect agent} ")
        Map.put( status, msg.type, Map.get(status, msg.type, []) ++ [msg] )
      end
    end )
    system=%{ email: "system", perms: ["auth.info_any_user"] }

    {:ok, %{ agent: agent, system: system} }
  end

  def check_if_event_on_serverboard(agent, event, shortname) do
    Agent.get agent, fn status ->
      deleted =Map.get(status,event,[])
      Logger.debug("Check if #{shortname} in #{inspect deleted}")
      ret = Enum.any? deleted, fn event ->
        if Map.get(event.data, :serverboard) do
          event.data.serverboard.shortname == shortname
        else
          event.data.shortname == shortname
        end
      end
    end
  end


  test "Serverboard lifecycle", %{ agent: agent, system: system } do
    import Serverboards.Serverboard

    user = Serverboards.Auth.User.user_info("dmoreno@serverboards.io", system)
    {:ok, "SBDS-TST3"} = serverboard_add "SBDS-TST3", %{ "name" => "serverboards" }, user
    assert check_if_event_on_serverboard(agent, "serverboard.added", "SBDS-TST3")

    :ok = serverboard_update "SBDS-TST3", %{ "name" => "Serverboards" }, user
    assert check_if_event_on_serverboard(agent, "serverboard.updated", "SBDS-TST3")

    {:ok, info} = serverboard_info "SBDS-TST3", user
    assert info.name == "Serverboards"

    :ok = serverboard_delete "SBDS-TST3", user
    assert check_if_event_on_serverboard(agent, "serverboard.deleted", "SBDS-TST3")

    assert {:error, :not_found} == serverboard_info "SBDS-TST3", user
  end

  test "Update serverboards tags", %{ system: system } do
    import Serverboards.Serverboard

    user = Serverboards.Auth.User.user_info("dmoreno@serverboards.io", system)
    {:error, :not_found } = serverboard_info "SBDS-TST5", user

    {:ok, "SBDS-TST5"} = serverboard_add "SBDS-TST5", %{ "name" => "serverboards" }, user
    {:ok, info } = serverboard_info "SBDS-TST5", user
    assert info.tags == []

    :ok = serverboard_update "SBDS-TST5", %{ "tags" => ~w(tag1 tag2 tag3)}, user
    {:ok, info } = serverboard_info "SBDS-TST5", user
    Logger.debug("Current serverboard info: #{inspect info}")
    assert Enum.member? info.tags, "tag1"
    assert Enum.member? info.tags, "tag2"
    assert Enum.member? info.tags, "tag3"
    assert not (Enum.member? info.tags, "tag4")

    serverboard_update "SBDS-TST5", %{ "tags" => ~w(tag1 tag2 tag4) }, user
    {:ok, info } = serverboard_info "SBDS-TST5", user
    assert Enum.member? info.tags, "tag1"
    assert Enum.member? info.tags, "tag2"
    assert not (Enum.member? info.tags, "tag3")
    assert Enum.member? info.tags, "tag4"

    :ok = serverboard_delete "SBDS-TST5", user
  end

  test "Serverboards as a client", %{ agent: agent } do
    {:ok, client} = Test.Client.start_link as: "dmoreno@serverboards.io"

    {:ok, dir} = Test.Client.call client, "dir", []
    Logger.debug("Known methods: #{inspect dir}")
    assert Enum.member? dir, "serverboard.list"
    assert Enum.member? dir, "serverboard.add"
    assert Enum.member? dir, "serverboard.delete"
    assert Enum.member? dir, "serverboard.info"

    #{:ok, json} = JSON.encode(Test.Client.debug client)
    #Logger.info("Debug information: #{json}")

    {:ok, l} = Test.Client.call client, "serverboard.list", []
    Logger.info("Got serverboards: #{inspect l}")
    assert (Enum.count l) >= 0

    {:ok, "SBDS-TST8"} = Test.Client.call client, "serverboard.add", [
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
    assert check_if_event_on_serverboard(agent, "serverboard.added", "SBDS-TST8")
    deleted=check_if_event_on_serverboard(agent, "serverboard.deleted", "SBDS-TST8")
    Logger.info("At serverboard deleted? #{deleted}")
    assert not deleted

    {:ok, cl} = Test.Client.call client, "serverboard.info", ["SBDS-TST8"]
    Logger.info("Info from serverboard #{inspect cl}")
    {:ok, json} = JSON.encode(cl)
    assert not String.contains? json, "__"
    assert (hd cl["components"])["name"] == "main web"
    assert (hd (tl cl["components"]))["name"] == "blog"

    {:ok, cls} = Test.Client.call client, "serverboard.list", []
    Logger.info("Info from serverboard #{inspect cls}")
    {:ok, json} = JSON.encode(cls)
    assert not String.contains? json, "__"
    assert Enum.any?(cls, &(&1["shortname"] == "SBDS-TST8"))


    {:ok, component} = Test.Client.call client, "component.add", %{ "tags" => ["email","test"], "type" => "email", "name" => "Email" }
    Test.Client.call client, "component.attach", ["SBDS-TST8", component]
    Test.Client.call client, "component.info", [component]
    Test.Client.call client, "component.list", []
    Test.Client.call client, "component.list", [["type","email"]]

    Test.Client.call client, "serverboard.update", [
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


    Test.Client.call client, "serverboard.delete", ["SBDS-TST8"]

    assert check_if_event_on_serverboard(agent, "serverboard.added", "SBDS-TST8")
    assert check_if_event_on_serverboard(agent, "serverboard.deleted", "SBDS-TST8")


    Test.Client.stop(client)
  end


  test "Tags into components", %{ system: system } do
    import Serverboards.Serverboard
    import Serverboards.Service.Component

    user = Serverboards.Auth.User.user_info("dmoreno@serverboards.io", system)
    {:ok, component } = component_add %{ "name" => "Test component", "tags" => ~w(tag1 tag2 tag3), "type" => "email" }, user
    {:ok, info } = component_info component, user
    assert info.tags == ["tag1", "tag2", "tag3"]

    component_update component, %{ "tags" => ["a","b","c"] }, user
    {:ok, info } = component_info component, user
    assert info.tags == ["a", "b", "c"]

    component_delete component, user
  end

  test "List available components" do
    import Serverboards.Service.Component

    components = component_list_available [], "dmoreno@serverboards.io"

    assert Enum.count(components) > 0
    assert Enum.count((hd components).fields) > 0
  end

  test "Update serverboard removing components", %{ system: system } do
    import Serverboards.Serverboard
    import Serverboards.Service.Component

    user = Serverboards.Auth.User.user_info("dmoreno@serverboards.io", system)

    # delete all
    serverboard_add "SBDS-TST10", %{ "name" => "Test 1", "components" => [%{ "type" => "email", "name" => "email", "config" => %{} }] }, user
    {:ok, info} = serverboard_info "SBDS-TST10", user
    assert Enum.count(info.components) == 1
    serverboard_update "SBDS-TST10", %{ "components" => []}, user
    {:ok, info} = serverboard_info "SBDS-TST10", user
    assert Enum.count(info.components) == 0

    # add one
    serverboard_update "SBDS-TST10", %{ "components" => [%{ "type" => "email", "name" => "add again email", "config" => %{} }]}, user
    {:ok, info} = serverboard_info "SBDS-TST10", user
    assert Enum.count(info.components) == 1

    # replace
    serverboard_update "SBDS-TST10", %{ "components" => [%{ "type" => "email", "name" => "replace email", "config" => %{} }]}, user
    {:ok, info} = serverboard_info "SBDS-TST10", user
    assert Enum.count(info.components) == 1

    serverboard_delete "SBDS-TST10", user
  end
end
