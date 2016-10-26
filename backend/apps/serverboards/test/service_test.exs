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

    # no removed services
    service_update service, %{ "description" => "Simple description" }, user
    {:ok, info } = service_info service, user
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
