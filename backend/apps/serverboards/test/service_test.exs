require Logger

defmodule ServerboardTest do
  use ExUnit.Case
  @moduletag :capture_log

  doctest Serverboards.Project, import: true
  doctest Serverboards.Service, import: true

  @email_type "serverboards.test.auth/email"

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
    Test.Client.expect(client, [{:method, event}, {~w(params project shortname), shortname}] )
  end

  def check_if_event_on_project(agent, event, shortname) do
    check_if_event_on_project(agent, event, shortname, 10)
  end
  def check_if_event_on_project(_agent, _event, _shortname, 0), do: false
  def check_if_event_on_project(agent, event, shortname, count) do
    ok = Agent.get agent, fn status ->
      events =Map.get(status, event, [])
      Logger.debug("Check if #{shortname} in #{inspect events} / #{inspect count}")
      Enum.any? events, fn event ->
        if Map.get(event.data, :project) do
          event.data.project.shortname == shortname
        else
          event.data.shortname == shortname
        end
      end
    end
    if ok do
      ok
    else # tries several times. polling, bad, but necessary.
      :timer.sleep 100
      check_if_event_on_project(agent, event, shortname, count - 1)
    end
  end

  test "Tags into services", %{ system: system } do
    import Serverboards.Project
    import Serverboards.Service

    {:ok, user} = Serverboards.Auth.User.user_info("dmoreno@serverboards.io", system)
    {:ok, service } = service_add %{ "name" => "Test service", "tags" => ~w(tag1 tag2 tag3), "type" => @email_type }, user
    {:ok, info } = service_get service, user
    assert info.tags == ["tag1", "tag2", "tag3"]

    service_update service, %{ "tags" => ["a","b","c"] }, user
    {:ok, info } = service_get service, user
    assert info.tags == ["a", "b", "c"]

    # no removed services
    service_update service, %{ "description" => "Simple description" }, user
    {:ok, info } = service_get service, user
    assert info.tags == ["a", "b", "c"]
    assert info.description == "Simple description"

    service_delete service, user
  end

  test "List service catalog" do
    import Serverboards.Service

    services = service_catalog []

    assert Enum.count(services) > 0
    assert Enum.count((hd services).fields) > 0
  end

  test "Update project removing services", %{ system: system } do
    import Serverboards.Project
    import Serverboards.Service

    {:ok, user} = Serverboards.Auth.User.user_info("dmoreno@serverboards.io", system)

    # delete all
    project_add "SBDS-TST10", %{ "name" => "Test 1", "services" => [%{ "type" => @email_type, "name" => "email", "config" => %{} }] }, user
    {:ok, info} = project_get "SBDS-TST10", user
    assert Enum.count(info.services) == 1
    project_update "SBDS-TST10", %{ "services" => []}, user
    {:ok, info} = project_get "SBDS-TST10", user
    assert Enum.count(info.services) == 0

    # add one
    project_update "SBDS-TST10", %{ "services" => [%{ "type" => @email_type, "name" => "add again email", "config" => %{} }]}, user
    {:ok, info} = project_get "SBDS-TST10", user
    assert Enum.count(info.services) == 1

    # replace
    project_update "SBDS-TST10", %{ "services" => [%{ "type" => @email_type, "name" => "replace email", "config" => %{} }]}, user
    {:ok, info} = project_get "SBDS-TST10", user
    assert Enum.count(info.services) == 1

    project_delete "SBDS-TST10", user
  end

  test "Service info has projects", %{ system: user } do
    import Serverboards.Project
    import Serverboards.Service

    {:ok, user} = Serverboards.Auth.User.user_info("dmoreno@serverboards.io", user)

    project_add "SBDS-TST11", %{ "name" => "Test 1", "services" => [%{ "type" => @email_type, "name" => "email", "config" => %{} }] }, user
    {:ok, uuid} = service_add %{ "name" => "Test service", "tags" => ~w(tag1 tag2 tag3), "type" => @email_type }, user

    {:ok, service} = service_get uuid, user
    assert not "SBDS-TST11" in service.projects

    service_attach "SBDS-TST11", uuid, user
    {:ok, service} = service_get uuid, user
    assert "SBDS-TST11" in service.projects

    project_delete "SBDS-TST11", user
  end

  test "Service RPC" do
    {:ok, client} = Test.Client.start_link as: "dmoreno@serverboards.io"
    {:ok, _catalog} = Test.Client.call(client, "service.catalog", [])
  end

  test "Service on_update as event" do
    {:ok, client} = Test.Client.start_link as: "dmoreno@serverboards.io"
    {:ok, uuid } = Test.Client.call(client, "plugin.start", ["serverboards.test.auth/fake"]) # ensure running
    :timer.sleep(300)
    {:ok, _ } = Test.Client.call(client, "event.subscribe", ["test.service.updated"] )

    {:ok, uuid} = Test.Client.call(client, "service.create", %{ name: "test", type: "serverboards.test.auth/server"})
    assert Test.Client.expect(client, method: "test.service.updated")

    {:ok, uuid} = Test.Client.call(client, "service.update", [uuid, %{ name: "test2" }])

    assert Test.Client.expect(client, method: "test.service.updated")
  end
end
