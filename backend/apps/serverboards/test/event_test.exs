require Logger

defmodule Serverboards.EventTest do
  use ExUnit.Case, async: false
  @moduletag :capture_log

  doctest Serverboards.Event, import: true

  test "Simple deliver event to client" do
    {:ok, client} = Test.Client.start_link as: "dmoreno@serverboards.io"

    Serverboards.Event.emit("test.event", %{})
    assert Test.Client.expect(client, method: "test.event")

    Test.Client.stop client
  end

  test "Cant deliver has no perm" do
    {:ok, client} = Test.Client.start_link as: "dmoreno@serverboards.io"

    Serverboards.Event.emit("test.event", %{}, ["invalid.perm"])
    assert not Test.Client.expect(client, method: "test.event")

    Test.Client.stop client
  end

  test "Deliver has perm" do
    {:ok, client} = Test.Client.start_link as: "dmoreno@serverboards.io"

    Serverboards.Event.emit("test.event", %{}, ["plugin"])
    assert Test.Client.expect(client, method: "test.event")

    Test.Client.stop client
  end

  test "Deliver/do not deliver permission change" do
    {:ok, client} = Test.Client.start_link as: "dmoreno@serverboards.io"

    Serverboards.Event.emit("test.event", %{}, ["plugin"])
    assert Test.Client.expect(client, method: "test.event")

    # change perms
    {:ok, :ok} = Test.Client.call(client, "group.remove_perm", ["admin","plugin"])
    Test.Client.expect(client, method: "user.updated")
    :timer.sleep(200)
    {:ok, user} = (Test.Client.call client, "auth.user", [])
    assert not "plugin" in user.perms

    Logger.info (inspect (Test.Client.call client, "auth.user", []))
    # check now cant
    Serverboards.Event.emit("test.event", %{}, ["plugin"])
    assert not Test.Client.expect(client, method: "test2.event")

    # add back
    {:ok, :ok} = Test.Client.call(client, "group.add_perm", ["admin","plugin"])

    Test.Client.stop client
  end

  test "Subscribe, list, unsubscribe" do
    {:ok, client} = Test.Client.start_link as: "dmoreno@serverboards.io"

    {:ok, :ok} = Test.Client.call(client, "event.subscribe", ["admin","plugin"])
    {:ok, ["admin","plugin"]} = Test.Client.call(client, "event.subscriptions", [])
    {:ok, :ok} = Test.Client.call(client, "event.unsubscribe", ["plugin"])
    {:ok, ["admin"]} = Test.Client.call(client, "event.subscriptions", [])
    {:ok, :ok} = Test.Client.call(client, "event.unsubscribe", ["admin"])

    Test.Client.stop client
  end


  test "Receive only subscribed" do
    alias Test.Client
    alias Serverboards.Event

    {:ok, client} = Client.start_link as: "dmoreno@serverboards.io"

    {:ok, :ok} = Client.call(client, "event.subscribe", ["test"])

    Event.emit("not-test", %{})
    assert not Client.expect(client, method: "not-test")

    Event.emit("test", %{})
    assert Client.expect(client, method: "test")

    # unsubscribe, do not receive
    {:ok, :ok} = Test.Client.call(client, "event.unsubscribe", ["test"])
    assert not Client.expect(client, method: "test" )


    Test.Client.stop client
  end

end
