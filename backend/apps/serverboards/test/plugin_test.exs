import Logger

defmodule Serverboards.PluginTest do
  use ExUnit.Case
  @moduletag :capture_log

  :ok = Application.ensure_started(:serverboards)

  doctest Serverboards.Plugin.Parser, import: true
  doctest Serverboards.Plugin.Registry, import: true
  doctest Serverboards.Plugin.Component, import: true
  doctest Serverboards.Plugin.Runner, import: true
  #doctest Serverboards.Auth.Permission

  alias Test.Client

  @tag :capture_log
  setup_all do
    Client.reset_db()
    :ok
  end

  test "Can start/call/stop plugins" do
    {:ok, client} = Client.start_link as: "dmoreno@serverboards.io"

    test_cmd = Client.call(client, "plugin.start", ["serverboards.test.auth/auth.test"])
    assert Client.call(client, "plugin.call", [test_cmd, "ping"]) == "pong"
    assert Client.call(client, "plugin.stop", [test_cmd]) == true

    assert Client.call(client, "plugin.call", [test_cmd, "ping"]) == {:error, :unknown_cmd}

    # Fallback UUID caller
    require Logger
    Logger.info("UUID Caller")
    test_cmd = Client.call(client, "plugin.start", ["serverboards.test.auth/auth.test"])
    assert Client.call(client, "#{test_cmd}.ping", []) == "pong"
    assert Client.call(client, "plugin.stop", [test_cmd]) == true
    assert_raise Serverboards.MOM.RPC.UnknownMethod, fn ->
      Client.call(client, "#{test_cmd}.ping", [])
    end
  end

  test "Set alias" do
    {:ok, client} = Client.start_link as: "dmoreno@serverboards.io"

    test_cmd = Client.call(client, "plugin.start", ["serverboards.test.auth/auth.test"])
    assert Client.call(client, "plugin.alias", [test_cmd, "test"])
    assert Client.call(client, "test.ping", []) == "pong"
    assert Client.call(client, "test.stop", ["test"]) == true
    assert Client.call(client, "test.stop", ["test"]) == false
    assert Client.call(client, "test.stop", [test_cmd]) == true
    assert_raise Serverboards.MOM.RPC.UnknownMethod, fn ->
      Client.call(client, "#{test_cmd}.ping", [])
    end
  end


  test "Dir after login at plugins" do
    {:ok, client} = Client.start_link as: "dmoreno@serverboards.io"

    dir = Client.call(client, "dir", [])
    assert dir != []
    assert Enum.member? dir, "ping"


    test_cmd1 = Client.call(client, "plugin.start", ["serverboards.test.auth/auth.test"])
    test_cmd2 = Client.call(client, "plugin.start", ["serverboards.test.auth/auth.test"])
    dir = Client.call(client, "dir", [])
    Logger.info (inspect dir)
    assert dir != []
    assert Enum.member? dir, test_cmd1<>".ping"
  end

end
