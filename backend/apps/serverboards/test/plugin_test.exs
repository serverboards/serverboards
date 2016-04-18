
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

  setup_all do
    Client.reset_db()
    :ok
  end

  test "Can start/call/stop plugins" do
    {:ok, client} = Client.start_link
    Task.async( fn -> Serverboards.Auth.authenticate(client) end)

    Client.expect( client, method: "auth.required" )
    user = Serverboards.Auth.User.get_user "dmoreno@serverboards.io"
    token = Serverboards.Auth.User.Token.create(user)

    user = Client.call( client, "auth.auth", %{ "type" => "token", "token" => token }, 2)

    test_cmd = Client.call(client, "plugin.start", ["serverboards.test.auth/auth.test"], 3)
    assert Client.call(client, "plugin.call", [test_cmd, "ping"], 4) == "pong"
    assert Client.call(client, "#{test_cmd}.ping", [], 4) == "pong"
    assert Client.call(client, "plugin.stop", [test_cmd], 5) == true

    assert Client.call(client, "plugin.call", [test_cmd, "ping"], 6) == {:error, :unknown_cmd}
    assert Client.call(client, "#{test_cmd}.ping", [], 4) == {:error, :unknown_cmd}
  end

end
