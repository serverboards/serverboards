require Logger

defmodule DashboardTest do
  use ExUnit.Case
  @moduletag :capture_log

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

  ## DEPRECATED 17.04
  test "Create project and widgets, no ES" do
    import Serverboards.Project
    import Serverboards.Project.Widget

    user = Test.User.system

    project_add "SBDS-TST12", %{ "name" => "Test 12" }, user
    {:ok, widget} = widget_add("SBDS-TST12", %{ config: %{}, widget: "test/widget"}, user)
    #Logger.debug(inspect list)

    {:ok, list} = widget_list("SBDS-TST12")

    Logger.debug(inspect widget)
    Logger.info("List of widgets at SBDS-TST12#{Serverboards.Utils.table_layout(list)}")

    assert Enum.any?(list, &(&1.uuid == widget))
    assert Enum.any?(list, &(&1.widget == "test/widget"))
    assert Enum.any?(list, &(&1.config == %{}))

    :ok = widget_update(widget, %{config: %{ "test" => true }}, user)
    {:ok, list} = widget_list("SBDS-TST12")
    Logger.info("List of widgets at SBDS-TST12#{Serverboards.Utils.table_layout(list)}")
    assert Enum.any?(list, &(&1.config == %{ "test" => true }))
  end

  ## DEPRECATED 17.04
  test "Project and widgets via RPC" do
    {:ok, client} = Test.Client.start_link as: "dmoreno@serverboards.io"
    Test.Client.call(client, "event.subscribe", ["dashboard.widget.created", "dashboard.widget.updated"])
    {:ok, sbds} = Test.Client.call(client, "project.create", ["SBDS-TST13", %{}] )
    {:ok, uuid} = Test.Client.call(client, "dashboard.widget.create", %{ project: "SBDS-TST13", widget: "test"})
    :timer.sleep(300)
    assert Test.Client.expect(client, method: "dashboard.widget.created")

    {:ok, _ } = Test.Client.call(client, "dashboard.widget.list", [sbds])

    {:ok, _uuid} = Test.Client.call(client, "dashboard.widget.update", %{ uuid: uuid, widget: "test2"})
    :timer.sleep(300)

    assert Test.Client.expect(client, method: "dashboard.widget.updated")
    {:ok, [%{"uuid" => uuid}]} = Test.Client.call(client, "dashboard.widget.list", [sbds])

    # just dont fail
    {:ok, _catalog} = Test.Client.call(client, "dashboard.widget.catalog", ["SBDS-TST13"])

    {:ok, _} = Test.Client.call(client, "dashboard.widget.delete", [uuid])
    {:ok, []} = Test.Client.call(client, "dashboard.widget.list", [sbds])
  end

  test "Create a dashboard no RPC" do
    import Serverboards.Project
    import Serverboards.Project.Dashboard
    import Serverboards.Project.Widget

    user = Test.User.system

    project_add "SBDS-TST14", %{ "name" => "Test 13" }, user
    {:ok, dashboard_uuid} = dashboard_add %{ project: "SBDS-TST14", name: "Tools", order: 1 }, user

    Logger.debug(inspect dashboard_list(%{project: "SBDS-TST14"}))
    assert Enum.count( dashboard_list(%{ project: "SBDS-TST14" }) ) == 2

    dashboard_update( %{ uuid: dashboard_uuid, name: "Tools 2"}, user)

    assert dashboard_get( dashboard_uuid ).name == "Tools 2"
    Logger.debug(inspect dashboard_list(%{project: "SBDS-TST14"}))

    names = for d <- dashboard_list(%{ project: "SBDS-TST14"}) do
      d.name
    end

    assert Enum.member?(names, "Tools 2")
    assert List.first(names) == "Monitoring"
    assert List.last(names) == "Tools 2"

    dashboard_update( %{ uuid: dashboard_uuid, order: -1}, user)
    Logger.debug(inspect dashboard_list(%{project: "SBDS-TST14"}))

    names = for d <- dashboard_list(%{ project: "SBDS-TST14"}) do
      d.name
    end

    assert List.first(names) == "Tools 2"
    assert List.last(names) == "Monitoring"

    widget_add_v2( dashboard_uuid, %{ widget: "test", config: %{}, ui: %{} }, user )

    db = dashboard_get( dashboard_uuid )
    Logger.debug( inspect db )
    assert "test" == List.first(db.widgets).widget


    :ok = dashboard_remove( dashboard_uuid, user )

    assert Enum.count( dashboard_list(%{ project: "SBDS-TST14" }) ) == 1

    db = dashboard_get( dashboard_uuid )
    Logger.debug( inspect db )
  end

  test "Dashboard manipulation RPC" do
    {:ok, client} = Test.Client.start_link as: "dmoreno@serverboards.io"
    Test.Client.call(client, "event.subscribe", ["dashboard.widget.created", "dashboard.widget.updated"])
    {:ok, sbds} = Test.Client.call(client, "project.create", ["SBDS-TST15", %{}] )

    {:ok, dashboard} = Test.Client.call(client, "dashboard.create", %{ project: sbds, name: "Tools" } )

    {:ok, widget} = Test.Client.call(client, "dashboard.widget.create", %{ dashboard: dashboard, widget: "test", config: %{}, ui: %{}})

    {:ok, list} = Test.Client.call(client, "dashboard.list", %{ project: sbds} )
    Logger.debug("All dashboard at #{inspect sbds}: #{inspect list}")

    {:ok, dash1} = Test.Client.call(client, "dashboard.get", %{ uuid: dashboard })
    Logger.debug("Details dashboard: #{inspect dash1}")

    assert not Map.get(dash1, "__meta__", false)

    assert Enum.count(list) == 2
    assert (List.first dash1["widgets"])["uuid"] == widget
    assert not Map.get((List.first list), "__meta__", false)

    {:ok, :ok} = Test.Client.call(client, "dashboard.delete", %{ uuid: dashboard })

    {:ok, list} = Test.Client.call(client, "dashboard.list", %{ project: sbds} )
    Logger.debug("All dashboards -1  at #{inspect sbds}: #{inspect list}")
    assert Enum.count(list) == 1

  end

  test "Dashboard extractors on queries" do
    {:ok, client} = Test.Client.start_link as: "dmoreno@serverboards.io"

    {:ok, sbds} = Test.Client.call(client, "project.create", ["SBDS-TST16", %{}] )

    {:ok, dashboard} = Test.Client.call(client, "dashboard.create", %{ project: sbds, name: "Tools" } )
    widget_config = %{
      __extractors__: [%{ extractor: "test.extractor/extractor", id: "A", service: nil }],
      q: "SELECT random FROM random"
    }
    {:ok, widget} = Test.Client.call(client, "dashboard.widget.create", %{
      dashboard: dashboard,
      widget: "test.extractor/widget",
      config: widget_config,
      ui: %{}
    })

    {:ok, data} = Test.Client.call(client, "dashboard.widget.extract", [widget, %{}])
    Logger.debug("data #{inspect data}")

    %{ "color" => nil, "q" => res} = data
    %{ "columns" => _columns, "rows" => _rows } = res
    assert Enum.count(res["rows"]) == 1
  end

  test "Dashboard extractors on queries, bad query returns error, not fails" do
    {:ok, client} = Test.Client.start_link as: "dmoreno@serverboards.io"

    {:ok, sbds} = Test.Client.call(client, "project.create", ["SBDS-TST17", %{}] )

    {:ok, dashboard} = Test.Client.call(client, "dashboard.create", %{ project: sbds, name: "Tools" } )
    widget_config = %{
      __extractors__: [%{ extractor: "test.extractor/extractor", id: "A", service: nil }],
      q: "SELECT dupa"
    }
    {:ok, widget} = Test.Client.call(client, "dashboard.widget.create", %{
      dashboard: dashboard,
      widget: "test.extractor/widget",
      config: widget_config,
      ui: %{}
    })

    {:ok, data} = Test.Client.call(client, "dashboard.widget.extract", [widget, %{}])
    Logger.debug("data #{inspect data}")

    %{ "color" => nil, "q" => res} = data
    %{ "error" => _columns } = res
  end

  test "Widget extractor without a SELECT just returns that data" do
    {:ok, client} = Test.Client.start_link as: "dmoreno@serverboards.io"

    {:ok, sbds} = Test.Client.call(client, "project.create", ["SBDS-TST18", %{}] )

    {:ok, dashboard} = Test.Client.call(client, "dashboard.create", %{ project: sbds, name: "Tools" } )
    widget_config = %{
      __extractors__: [%{ extractor: "test.extractor/extractor", id: "A", service: nil }],
      q: "42"
    }
    {:ok, widget} = Test.Client.call(client, "dashboard.widget.create", %{
      dashboard: dashboard,
      widget: "test.extractor/widget",
      config: widget_config,
      ui: %{}
    })

    {:ok, data} = Test.Client.call(client, "dashboard.widget.extract", [widget, %{}])
    Logger.debug("data #{inspect data}")

    %{ "color" => nil, "q" => res} = data
    %{ "rows" => [["42"]] } = res
  end

end
