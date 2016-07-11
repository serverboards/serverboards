require Logger

defmodule Serverboards.ActionTest do
  use ExUnit.Case
	alias Test.Client
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

    {:ok, uuid} = Test.Client.call(client, "action.trigger",
      ["serverboards.test.auth/action", %{ url: "https://serverboards.io" }])
    assert Test.Client.expect(client, method: "action.started")
    assert Test.Client.expect(client, [{:method, "action.stopped"}, {~w(params status)a, "ok"}])

    Test.Client.stop client
  end

  test "Execute action, has full command path" do
    {:ok, client} = Test.Client.start_link as: "dmoreno@serverboards.io"
    {:ok, :ok} = Test.Client.call(client, "event.subscribe", ["action.started","action.stopped"])

    {:ok, uuid} = Test.Client.call(client, "action.trigger",
      ["serverboards.test.auth/action.full-command-path", %{ url: "https://serverboards.io" }])
    assert Test.Client.expect(client, method: "action.started")
    assert Test.Client.expect(client, [{:method, "action.stopped"}, {~w(params status)a, "ok"}])

    Test.Client.stop client
  end

  test "Action list" do
    {:ok, client} = Test.Client.start_link as: "dmoreno@serverboards.io"

    {:ok, [_c]} = Test.Client.call(client, "action.filter",
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


    {:ok, history} = Test.Client.call(client, "action.history", [])
    Logger.info("History: #{inspect history}")
    assert "serverboards.test.auth/action" in Enum.map(history, &(&1["type"]))
    :timer.sleep(500)

    {:ok, details} = Test.Client.call(client, "action.history", [ (hd history)["uuid"] ])
    assert details["uuid"] == (hd history)["uuid"]
    assert details["status"] == "ok"
    assert details["elapsed"] != nil


    Test.Client.stop client
  end

end
