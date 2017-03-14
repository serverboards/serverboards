require Logger

defmodule Serverboards.ActionTest do
  use ExUnit.Case
	@moduletag :capture_log

  doctest Serverboards.Action, import: true

  setup do
    # Explicitly get a connection before each test
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(Serverboards.Repo)
    # Setting the shared mode must be done only after checkout
    Ecto.Adapters.SQL.Sandbox.mode(Serverboards.Repo, {:shared, self()})
  end


  test "Execute basic trigger from client" do
    {:ok, client} = Test.Client.start_link as: "dmoreno@serverboards.io"
    {:ok, :ok} = Test.Client.call(client, "event.subscribe", ["action.started","action.stopped"])

    {:ok, _uuid} = Test.Client.call(client, "action.trigger",
      ["serverboards.test.auth/action", %{ url: "https://serverboards.io" }])
    assert Test.Client.expect(client, method: "action.started")
    assert Test.Client.expect(client, [{:method, "action.stopped"}, {~w(params status)a, "ok"}])

    Test.Client.stop client
  end

  test "Execute action, has full command path" do
    {:ok, client} = Test.Client.start_link as: "dmoreno@serverboards.io"
    {:ok, :ok} = Test.Client.call(client, "event.subscribe", ["action.started","action.stopped"])

    {:ok, _uuid} = Test.Client.call(client, "action.trigger",
      ["serverboards.test.auth/action.full-command-path", %{ url: "https://serverboards.io" }])
    assert Test.Client.expect(client, method: "action.started")
    assert Test.Client.expect(client, [{:method, "action.stopped"}, {~w(params status)a, "ok"}])

    Test.Client.stop client
  end

  test "Action list" do
    {:ok, client} = Test.Client.start_link as: "dmoreno@serverboards.io"

    {:ok, [_c]} = Test.Client.call(client, "action.catalog",
      %{ "traits" => ["test"] } )

    Test.Client.stop client
  end

  test "Invalid action" do
    {:ok, client} = Test.Client.start_link as: "dmoreno@serverboards.io"

    assert Test.Client.call(client, "action.trigger",
      ["invalid.action", %{}] ) == {:error, "unknown_action"}

    Test.Client.stop client
  end

  test "Get previous actions" do
    {:ok, client} = Test.Client.start_link as: "dmoreno@serverboards.io"

    {:ok, :ok} = Test.Client.call(client, "event.subscribe", ["action.started","action.stopped"])
    # to ensure at least one of this
    {:ok, uuid} = Test.Client.call(client, "action.trigger",
      ["serverboards.test.auth/action", %{ url: "https://serverboards.io" }])

    assert Test.Client.expect(client, [{:method, "action.stopped"}, {~w(params uuid)a, uuid}])
    :timer.sleep(1000)

    {:ok, history} = Test.Client.call(client, "action.list", [])
    Logger.info("History: #{inspect history}")
    assert "serverboards.test.auth/action" in Enum.map(history["list"], &(&1["type"]))
    :timer.sleep(500)

    {:ok, details} = Test.Client.call(client, "action.get", [(hd history["list"])["uuid"]] )
    assert details["uuid"] == (hd history["list"])["uuid"]
    assert details["status"] == "ok"
    assert details["elapsed"] != nil


    Test.Client.stop client
  end

  test "Run wrong action, log it properly" do
    {:ok, client} = Test.Client.start_link as: "dmoreno@serverboards.io"

    {:ok, :ok} = Test.Client.call(client, "event.subscribe", ["action.started","action.stopped"])

    # ok action
    {:ok, uuid_ok_a} = Test.Client.call(client, "action.trigger",
      ["serverboards.test.auth/action", %{ url: "https://serverboards.io" }])

    # fail action
    {:ok, uuid_nok_b} = Test.Client.call(client, "action.trigger",
      ["serverboards.test.auth/abort", %{}])

    # ok action
    {:ok, uuid_ok_c} = Test.Client.call(client, "action.trigger",
      ["serverboards.test.auth/action", %{ url: "https://serverboards.io" }])

    assert Test.Client.expect(client, [{:method, "action.stopped"}, {~w(params uuid)a, uuid_ok_a}, {~w(params status)a, "ok"}])
    assert Test.Client.expect(client, [{:method, "action.stopped"}, {~w(params uuid)a, uuid_nok_b}, {~w(params status)a, "error"}])
    assert Test.Client.expect(client, [{:method, "action.stopped"}, {~w(params uuid)a, uuid_ok_c}, {~w(params status)a, "ok"}])
  end

  test "Action update, set progress" do
    {:ok, client} = Test.Client.start_link as: "dmoreno@serverboards.io"

    {:ok, :ok} = Test.Client.call(client, "event.subscribe", ["action.started","action.stopped","action.updated"])
    {:ok, uuid} = Test.Client.call(client, "action.trigger",
      ["serverboards.test.auth/action", %{ url: "https://serverboards.io", sleep: 3 }])

    {:ok, _} = Test.Client.call(client, "action.update",
      [uuid, %{ progress: 10, label: "Test" }])

    assert Test.Client.expect(client, [{:method, "action.updated"},
      {~w(params uuid)a, uuid},
      {~w(params progress)a, 10},
      {~w(params label)a, "Test"}
      ])
  end

end
