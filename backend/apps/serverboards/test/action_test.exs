require Logger

defmodule Serverboards.ActionTest do
  use ExUnit.Case
	alias Test.Client
	@moduletag :capture_log

  doctest Serverboards.Action, import: true

  test "Execute basic trigger from client" do
    {:ok, client} = Test.Client.start_link as: "dmoreno@serverboards.io"
    {:ok, :ok} = Test.Client.call(client, "event.subscribe", ["action.started","action.stopped"])

    {:ok, uuid} = Test.Client.call(client, "action.trigger",
      ["serverboards.test.auth/action", %{ url: "https://serverboards.io" }])

    Logger.info(uuid)
    assert Test.Client.expect(client, method: "action.started")
    assert Test.Client.expect(client, method: "action.stopped")

    Test.Client.stop client
  end

  test "Action list" do
    {:ok, client} = Test.Client.start_link as: "dmoreno@serverboards.io"

    {:ok, [_c]} = Test.Client.call(client, "action.filter",
      %{ trait: "test"} )

    Test.Client.stop client
  end

end
