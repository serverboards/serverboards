require Logger

defmodule EventTest do
  use ExUnit.Case, async: false
  @moduletag :capture_log

  alias Test.Client
  alias Serverboards.Event


  doctest Event, import: true

  test "Simple deliver event to client" do
    {:ok, client} = Client.start_link as: "dmoreno@serverboards.io"

    {:ok, :ok} = Client.call(client, "event.subscribe", ["test.event"])
    Event.emit("test.event", %{})
    assert Client.expect(client, method: "test.event")

    Client.stop client
  end

  test "Cant deliver has no perm" do
    {:ok, client} = Client.start_link as: "dmoreno@serverboards.io"

    {:ok, :ok} = Client.call(client, "event.subscribe", ["test.event"])
    Event.emit("test.event", %{}, ["invalid.perm"])
    assert not Client.expect(client, method: "test.event")

    Client.stop client
  end

  test "Deliver has perm" do
    {:ok, client} = Client.start_link as: "dmoreno@serverboards.io"

    {:ok, :ok} = Client.call(client, "event.subscribe", ["test.event"])
    Event.emit("test.event", %{}, ["plugin"])
    assert Client.expect(client, method: "test.event")

    Client.stop client
  end

  test "Deliver/do not deliver permission change" do
    {:ok, client} = Client.start_link as: "dmoreno@serverboards.io"

    {:ok, :ok} = Client.call(client, "event.subscribe", ["test.event"])
    Event.emit("test.event", %{}, ["plugin"])
    assert Client.expect(client, method: "test.event")

    # change perms
    {:ok, :ok} = Client.call(client, "group.remove_perm", ["admin","plugin"])
    Client.expect(client, method: "user.updated")
    :timer.sleep(200)
    {:ok, user} = (Client.call client, "auth.user", [])
    assert not "plugin" in user["perms"]

    Logger.info (inspect (Client.call client, "auth.user", []))
    # check now cant
    Event.emit("test.event", %{}, ["plugin"])
    assert not Client.expect(client, method: "test2.event")

    # add back
    {:ok, :ok} = Client.call(client, "group.add_perm", ["admin","plugin"])

    Client.stop client
  end

  test "Subscribe, list, unsubscribe" do
    {:ok, client} = Client.start_link as: "dmoreno@serverboards.io"

    {:ok, :ok} = Client.call(client, "event.subscribe", ["admin","plugin"])
    {:ok, ["admin","plugin"]} = Client.call(client, "event.subscriptions", [])
    {:ok, :ok} = Client.call(client, "event.unsubscribe", ["plugin"])
    {:ok, ["admin"]} = Client.call(client, "event.subscriptions", [])
    {:ok, :ok} = Client.call(client, "event.unsubscribe", ["admin"])

    Client.stop client
  end


  test "Receive only subscribed" do
    {:ok, client} = Client.start_link as: "dmoreno@serverboards.io"

    {:ok, :ok} = Client.call(client, "event.subscribe", ["test"])

    Event.emit("not-test", %{})
    assert not Client.expect(client, method: "not-test")

    Event.emit("test", %{})
    assert Client.expect(client, method: "test")

    # unsubscribe, do not receive
    {:ok, :ok} = Client.call(client, "event.unsubscribe", ["test"])
    assert not Client.expect(client, method: "test" )


    Client.stop client
  end

end
