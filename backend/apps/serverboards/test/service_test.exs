require Logger

defmodule ServerboardTest do
  use ExUnit.Case
  @moduletag :capture_log

  doctest Serverboards.Serverboard, import: true
  doctest Serverboards.Service, import: true

  def email_type, do: "serverboards.test.auth/email"

  setup_all do
    {:ok, agent } = Agent.start_link fn -> %{} end
    MOM.Channel.subscribe( :client_events, fn %{ payload: msg } ->
      Agent.update agent, fn status ->
        Logger.info("New message to client #{inspect msg}. #{inspect agent} ")
        Map.put( status, msg.type, Map.get(status, msg.type, []) ++ [msg] )
      end
    end )
    system=%{ email: "system", perms: ["auth.info_any_user"] }

    {:ok, %{ agent: agent, system: system} }
  end

  setup do
    # Explicitly get a connection before each test
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(Serverboards.Repo)
    # Setting the shared mode must be done only after checkout
    Ecto.Adapters.SQL.Sandbox.mode(Serverboards.Repo, {:shared, self()})
  end

  def check_if_event_on_client(client, event, shortname) do
    Test.Client.expect(client, [{:method, event}, {~w(params serverboard shortname), shortname}] )
  end

  def check_if_event_on_serverboard(agent, event, shortname) do
    check_if_event_on_serverboard(agent, event, shortname, 10)
  end
  def check_if_event_on_serverboard(_agent, _event, _shortname, 0), do: false
  def check_if_event_on_serverboard(agent, event, shortname, count) do
    ok = Agent.get agent, fn status ->
      events =Map.get(status, event, [])
      Logger.debug("Check if #{shortname} in #{inspect events} / #{inspect count}")
      Enum.any? events, fn event ->
        if Map.get(event.data, :serverboard) do
          event.data.serverboard.shortname == shortname
        else
          event.data.shortname == shortname
        end
      end
    end
    if ok do
      ok
    else # tries several times. polling, bad, but necessary.
      :timer.sleep 100
      check_if_event_on_serverboard(agent, event, shortname, count - 1)
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

    Test.Client.call(client, "event.subscribe", [
      "serverboard.added","serverboard.deleted","serverboard.updated"
      ])
    {:ok, l} = Test.Client.call client, "serverboard.list", []
    Logger.info("Got serverboards: #{inspect l}")
    assert (Enum.count l) >= 0

    {:ok, "SBDS-TST8"} = Test.Client.call client, "serverboard.add", [
      "SBDS-TST8",
      %{
        "name" => "Serverboards test",
        "tags" => ["tag1", "tag2"],
        "services" => [
          %{ "type" => "test", "name" => "main web", "config" => %{ "url" => "http://serverboards.io" } },
          %{ "type" => "test", "name" => "blog", "config" => %{ "url" => "http://serverboards.io/blog" } },
        ]
      }
    ]
    assert check_if_event_on_client(client, "serverboard.added", "SBDS-TST8")
    deleted=check_if_event_on_client(client, "serverboard.deleted", "SBDS-TST8")
    Logger.info("At serverboard deleted? #{deleted}")
    assert not deleted

    {:ok, cl} = Test.Client.call client, "serverboard.info", ["SBDS-TST8"]
    Logger.info("Info from serverboard #{inspect cl}")
    {:ok, json} = JSON.encode(cl)
    assert not String.contains? json, "__"
    assert (hd cl["services"])["name"] == "main web"
    assert (hd (tl cl["services"]))["name"] == "blog"

    {:ok, cls} = Test.Client.call client, "serverboard.list", []
    Logger.info("Info from serverboard #{inspect cls}")
    {:ok, json} = JSON.encode(cls)
    assert not String.contains? json, "__"
    assert Enum.any?(cls, &(&1["shortname"] == "SBDS-TST8"))


    {:ok, service} = Test.Client.call client, "service.add", %{ "tags" => ["email","test"], "type" => email_type, "name" => "Email" }
    Test.Client.call client, "service.attach", ["SBDS-TST8", service]
    Test.Client.call client, "service.info", [service]
    Test.Client.call client, "service.list", []
    Test.Client.call client, "service.list", [["type","email"]]

    Test.Client.call client, "serverboard.update", [
      "SBDS-TST8",
      %{
        "services" => [
          %{ "uuid" => service, "name" => "new name" }
        ]
      }
    ]
    {:ok, info} = Test.Client.call client, "service.info", [service]
    assert info["name"] == "new name"

    Test.Client.call client, "service.delete", [service]
    {:ok, services} = Test.Client.call client, "service.list", [["type","email"]]
    assert not (Enum.any? services, &(&1["uuid"] == service))


    Test.Client.call client, "serverboard.delete", ["SBDS-TST8"]

    assert check_if_event_on_client(client, "serverboard.updated", "SBDS-TST8")
    assert Test.Client.expect(client, [{:method, "serverboard.deleted"}, {[:params, :shortname], "SBDS-TST8"}])


    Test.Client.stop(client)
  end


  test "Tags into services", %{ system: system } do
    import Serverboards.Serverboard
    import Serverboards.Service

    user = Serverboards.Auth.User.user_info("dmoreno@serverboards.io", system)
    {:ok, service } = service_add %{ "name" => "Test service", "tags" => ~w(tag1 tag2 tag3), "type" => email_type }, user
    {:ok, info } = service_info service, user
    assert info.tags == ["tag1", "tag2", "tag3"]

    service_update service, %{ "tags" => ["a","b","c"] }, user
    {:ok, info } = service_info service, user
    assert info.tags == ["a", "b", "c"]

    service_delete service, user
  end

  test "List service catalog" do
    import Serverboards.Service

    services = service_catalog [], "dmoreno@serverboards.io"

    assert Enum.count(services) > 0
    assert Enum.count((hd services).fields) > 0
  end

  test "Update serverboard removing services", %{ system: system } do
    import Serverboards.Serverboard
    import Serverboards.Service

    user = Serverboards.Auth.User.user_info("dmoreno@serverboards.io", system)

    # delete all
    serverboard_add "SBDS-TST10", %{ "name" => "Test 1", "services" => [%{ "type" => email_type, "name" => "email", "config" => %{} }] }, user
    {:ok, info} = serverboard_info "SBDS-TST10", user
    assert Enum.count(info.services) == 1
    serverboard_update "SBDS-TST10", %{ "services" => []}, user
    {:ok, info} = serverboard_info "SBDS-TST10", user
    assert Enum.count(info.services) == 0

    # add one
    serverboard_update "SBDS-TST10", %{ "services" => [%{ "type" => email_type, "name" => "add again email", "config" => %{} }]}, user
    {:ok, info} = serverboard_info "SBDS-TST10", user
    assert Enum.count(info.services) == 1

    # replace
    serverboard_update "SBDS-TST10", %{ "services" => [%{ "type" => email_type, "name" => "replace email", "config" => %{} }]}, user
    {:ok, info} = serverboard_info "SBDS-TST10", user
    assert Enum.count(info.services) == 1

    serverboard_delete "SBDS-TST10", user
  end

  test "Service info has serverboards", %{ system: user } do
    import Serverboards.Serverboard
    import Serverboards.Service

    user = Serverboards.Auth.User.user_info("dmoreno@serverboards.io", user)

    serverboard_add "SBDS-TST11", %{ "name" => "Test 1", "services" => [%{ "type" => email_type, "name" => "email", "config" => %{} }] }, user
    {:ok, uuid} = service_add %{ "name" => "Test service", "tags" => ~w(tag1 tag2 tag3), "type" => email_type }, user

    {:ok, service} = service_info uuid, user
    assert not "SBDS-TST11" in service.serverboards

    service_attach "SBDS-TST11", uuid, user
    {:ok, service} = service_info uuid, user
    assert "SBDS-TST11" in service.serverboards

    serverboard_delete "SBDS-TST11", user
  end
end
