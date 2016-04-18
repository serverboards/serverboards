
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

    test_cmd = Client.call(client, "plugin.start", ["serverboards.test.auth/auth.test"], 3)
    assert Client.call(client, "plugin.call", [test_cmd, "ping"], 4) == "pong"
    assert Client.call(client, "plugin.stop", [test_cmd], 5) == true

    assert Client.call(client, "plugin.call", [test_cmd, "ping"], 6) == {:error, :unknown_cmd}

    # Fallback UUID caller
    require Logger
    Logger.info("UUID Caller")
    test_cmd = Client.call(client, "plugin.start", ["serverboards.test.auth/auth.test"], 3)
    assert Client.call(client, "#{test_cmd}.ping", [], 4) == "pong"
    assert Client.call(client, "plugin.stop", [test_cmd], 5) == true
    assert_raise Serverboards.MOM.RPC.UnknownMethod, fn ->
      Client.call(client, "#{test_cmd}.ping", [], 4) == {:error, :unknown_cmd}
    end
  end

end
