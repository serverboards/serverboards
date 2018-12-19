require Logger

defmodule ProjectTest do
  use ExUnit.Case
  @moduletag :capture_log

  doctest Serverboards
  doctest Serverboards.Utils, import: true
  doctest Serverboards.Utils.Decorators, import: true

  @email_type "serverboards.test.auth/email"

  def check_if_event_on_client(client, event, shortname) do
    Test.Client.expect(client, [{:method, event}, {~w(params project shortname), shortname}], 500)
  end

  def check_if_event_on_project(agent, event, shortname) do
    check_if_event_on_project(agent, event, shortname, 10)
  end

  def check_if_event_on_project(_agent, _event, _shortname, 0), do: false

  def check_if_event_on_project(agent, event, shortname, count) do
    ok =
      Agent.get(agent, fn status ->
        events = Map.get(status, event, [])
        Logger.debug("Check if #{shortname} in #{inspect(events)} / #{inspect(count)}")

        Enum.any?(events, fn event ->
          if Map.get(event.data, :project) do
            event.data.project.shortname == shortname
          else
            event.data.shortname == shortname
          end
        end)
      end)

    # tries several times. polling, bad, but necessary.
    if ok do
      ok
    else
      :timer.sleep(100)
      check_if_event_on_project(agent, event, shortname, count - 1)
    end
  end

  setup_all do
    {:ok, agent} = Agent.start_link(fn -> %{} end)

    MOM.Channel.subscribe(:client_events, fn msg ->
      Agent.update(agent, fn status ->
        Logger.info("New message to client #{inspect(msg)}. #{inspect(agent)} ")
        Map.put(status, msg.type, Map.get(status, msg.type, []) ++ [msg])
      end)
    end)

    system = %{email: "system", perms: ["auth.info_any_user"]}

    {:ok, %{agent: agent, system: system}}
  end

  setup do
    # Explicitly get a connection before each test
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(Serverboards.Repo)
    # Setting the shared mode must be done only after checkout
    Ecto.Adapters.SQL.Sandbox.mode(Serverboards.Repo, {:shared, self()})
  end

  test "Project lifecycle", %{agent: agent, system: system} do
    import Serverboards.Project

    {:ok, user} = Serverboards.Auth.User.user_info("dmoreno@serverboards.io", system)
    {:ok, "SBDS-TST3"} = project_add("SBDS-TST3", %{"name" => "serverboards"}, user)
    assert check_if_event_on_project(agent, "project.created", "SBDS-TST3")

    :ok = project_update("SBDS-TST3", %{"name" => "Serverboards"}, user)
    assert check_if_event_on_project(agent, "project.updated", "SBDS-TST3")

    {:ok, info} = project_get("SBDS-TST3", user)
    assert info.name == "Serverboards"

    :ok = project_delete("SBDS-TST3", user)
    assert check_if_event_on_project(agent, "project.deleted", "SBDS-TST3")

    assert {:error, :not_found} == project_get("SBDS-TST3", user)
  end

  test "Update serverboards tags", %{system: system} do
    import Serverboards.Project

    {:ok, user} = Serverboards.Auth.User.user_info("dmoreno@serverboards.io", system)
    {:error, :not_found} = project_get("SBDS-TST5", user)

    {:ok, "SBDS-TST5"} = project_add("SBDS-TST5", %{"name" => "serverboards"}, user)
    {:ok, info} = project_get("SBDS-TST5", user)
    assert info.tags == []

    :ok = project_update("SBDS-TST5", %{"tags" => ~w(tag1 tag2 tag3)}, user)
    {:ok, info} = project_get("SBDS-TST5", user)
    Logger.debug("Current project info: #{inspect(info)}")
    assert Enum.member?(info.tags, "tag1")
    assert Enum.member?(info.tags, "tag2")
    assert Enum.member?(info.tags, "tag3")
    assert not Enum.member?(info.tags, "tag4")

    project_update("SBDS-TST5", %{"tags" => ~w(tag1 tag2 tag4)}, user)
    {:ok, info} = project_get("SBDS-TST5", user)
    assert Enum.member?(info.tags, "tag1")
    assert Enum.member?(info.tags, "tag2")
    assert not Enum.member?(info.tags, "tag3")
    assert Enum.member?(info.tags, "tag4")

    # should not remove tags
    :ok = project_update("SBDS-TST5", %{"description" => "A simple description"}, user)
    {:ok, info} = project_get("SBDS-TST5", user)
    assert Enum.member?(info.tags, "tag1")
    assert Enum.member?(info.tags, "tag2")
    assert Enum.member?(info.tags, "tag4")

    :ok = project_delete("SBDS-TST5", user)
  end

  test "Serverboards as a client", %{} do
    {:ok, client} = Test.Client.start_link(as: "dmoreno@serverboards.io")

    {:ok, dir} = Test.Client.call(client, "dir", [])
    Logger.debug("Known methods: #{inspect(dir)}")
    assert Enum.member?(dir, "project.list")
    assert Enum.member?(dir, "project.create")
    assert Enum.member?(dir, "project.delete")
    assert Enum.member?(dir, "project.get")

    # {:ok, json} = Poison.encode(Test.Client.debug client)
    # Logger.info("Debug information: #{json}")

    Test.Client.call(client, "event.subscribe", [
      "project.created",
      "project.deleted",
      "project.updated"
    ])

    {:ok, l} = Test.Client.call(client, "project.list", [])
    Logger.info("Got serverboards: #{inspect(l)}")
    assert Enum.count(l) >= 0

    {:ok, "SBDS-TST8"} =
      Test.Client.call(client, "project.create", [
        "SBDS-TST8",
        %{
          "name" => "Serverboards test",
          "tags" => ["tag1", "tag2"],
          "services" => [
            %{
              "type" => "test",
              "name" => "main web",
              "config" => %{"url" => "http://serverboards.io"}
            },
            %{
              "type" => "test",
              "name" => "blog",
              "config" => %{"url" => "http://serverboards.io/blog"}
            }
          ]
        }
      ])

    assert check_if_event_on_client(client, "project.created", "SBDS-TST8")
    deleted = check_if_event_on_client(client, "project.deleted", "SBDS-TST8")
    Logger.info("At project deleted? #{deleted}")
    assert not deleted

    {:ok, cl} = Test.Client.call(client, "project.get", ["SBDS-TST8"])
    Logger.info("Info from project #{inspect(cl)}")
    {:ok, json} = Poison.encode(cl)
    assert not String.contains?(json, "__"), json
    assert hd(cl["services"])["name"] == "main web"
    assert hd(tl(cl["services"]))["name"] == "blog"

    {:ok, cls} = Test.Client.call(client, "project.list", [])
    Logger.info("Info from project #{inspect(cls)}")
    {:ok, json} = Poison.encode(cls)
    assert not String.contains?(json, "__")
    assert Enum.any?(cls, &(&1["shortname"] == "SBDS-TST8"))

    {:ok, service} =
      Test.Client.call(client, "service.create", %{
        "tags" => ["email", "test"],
        "type" => @email_type,
        "name" => "Email"
      })

    Test.Client.call(client, "service.attach", ["SBDS-TST8", service])
    Test.Client.call(client, "service.get", [service])
    Test.Client.call(client, "service.list", [])
    Test.Client.call(client, "service.list", [["type", "email"]])

    Test.Client.call(client, "project.update", [
      "SBDS-TST8",
      %{
        "services" => [
          %{"uuid" => service, "name" => "new name"}
        ]
      }
    ])

    {:ok, info} = Test.Client.call(client, "service.get", [service])
    assert info["name"] == "new name"

    Test.Client.call(client, "service.delete", [service])
    {:ok, services} = Test.Client.call(client, "service.list", [["type", "email"]])
    assert not Enum.any?(services, &(&1["uuid"] == service))

    Test.Client.call(client, "project.delete", ["SBDS-TST8"])

    assert check_if_event_on_client(client, "project.updated", "SBDS-TST8")

    assert Test.Client.expect(client, [
             {:method, "project.deleted"},
             {[:params, :shortname], "SBDS-TST8"}
           ])

    Test.Client.stop(client)
  end

  test "Screens on project -- removed 201808", %{system: system} do
    import Serverboards.Project
    import Serverboards.Service
    {:ok, user} = Serverboards.Auth.User.user_info("dmoreno@serverboards.io", system)
    project_add("SBDS-TST13", %{"name" => "Test 13"}, user)

    {:ok, info} = project_get("SBDS-TST13", user)
    screens = Map.get(info, :screens)
    assert screens == nil
  end
end
