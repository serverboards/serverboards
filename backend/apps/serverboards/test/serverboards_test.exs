require Logger

defmodule ServerboardsTest do
  use ExUnit.Case
  @moduletag :capture_log

  doctest Serverboards
  doctest Serverboards.Utils, import: true
  doctest Serverboards.Utils.Decorators, import: true

  setup do
    # Explicitly get a connection before each test
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(Serverboards.Repo)
    # Setting the shared mode must be done only after checkout
    Ecto.Adapters.SQL.Sandbox.mode(Serverboards.Repo, {:shared, self()})
  end

  test "Create serverboard and widgets, no ES" do
    import Serverboards.Serverboard
    import Serverboards.Serverboard.Widget

    user = Test.User.system

    serverboard_add "SBDS-TST12", %{ "name" => "Test 12" }, user
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

  test "Serverboard and widgets via RPC" do
    {:ok, client} = Test.Client.start_link as: "dmoreno@serverboards.io"
    Test.Client.call(client, "event.subscribe", ["serverboard.widget.added", "serverboard.widget.updated"])
    {:ok, sbds} = Test.Client.call(client, "serverboard.add", ["SBDS-TST13", %{}] )
    {:ok, uuid} = Test.Client.call(client, "serverboard.widget.add", %{ serverboard: "SBDS-TST13", widget: "test"})
    :timer.sleep(300)
    assert Test.Client.expect(client, method: "serverboard.widget.added")

    {:ok, _ } = Test.Client.call(client, "serverboard.widget.list", [sbds])

    {:ok, _uuid} = Test.Client.call(client, "serverboard.widget.update", %{ uuid: uuid, widget: "test2"})
    :timer.sleep(300)

    assert Test.Client.expect(client, method: "serverboard.widget.updated")
    {:ok, [%{"uuid" => uuid}]} = Test.Client.call(client, "serverboard.widget.list", [sbds])

    # just dont fail
    {:ok, _catalog} = Test.Client.call(client, "serverboard.widget.catalog", ["SBDS-TST13"])
  end
end
