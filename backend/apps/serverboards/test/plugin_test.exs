require Logger

defmodule Serverboards.PluginTest do
  use ExUnit.Case
  @moduletag :capture_log
  @moduletag timeout: 10_000

  :ok = Application.ensure_started(:serverboards)

  alias Test.Client

  setup do
    # Explicitly get a connection before each test
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(Serverboards.Repo)
    # Setting the shared mode must be done only after checkout
    Ecto.Adapters.SQL.Sandbox.mode(Serverboards.Repo, {:shared, self()})
  end

  test "Plugin test no RPC, singleton" do
    component = "serverboards.test.auth/fake_singleton"
    {:ok, uuid} = Serverboards.Plugin.Runner.start(component, "test")
    # If start again, same uuid
    assert {:ok, uuid} == Serverboards.Plugin.Runner.start(component, "test")
    assert {:error, :cant_stop} == Serverboards.Plugin.Runner.stop(uuid)
    # If start again, same uuid
    {:ok, ^uuid} = Serverboards.Plugin.Runner.start(component, "test")

    :timer.sleep(1500)
    # Should have stopped in bg, if start new uuid
    {:ok, uuid2} = Serverboards.Plugin.Runner.start(component, "test")
    assert uuid2 != uuid
  end

  test "Plugin test no RPC, one_for_one, timeout" do
    component = "serverboards.test.auth/fake_one_for_one"
    {:ok, uuid1} = Serverboards.Plugin.Runner.start(component, "test")
    # If start again, another uuid, still running
    {:ok, uuid2} = Serverboards.Plugin.Runner.start(component, "test")
    assert uuid1 != uuid2
    assert :running == Serverboards.Plugin.Runner.status(uuid1)
    assert :running == Serverboards.Plugin.Runner.status(uuid2)
    # stop 1
    true = Serverboards.Plugin.Runner.stop(uuid1)
    assert :not_running == Serverboards.Plugin.Runner.status(uuid1)
    assert :running == Serverboards.Plugin.Runner.status(uuid2)
    # timeout, not running
    :timer.sleep(1500)
    assert :not_running == Serverboards.Plugin.Runner.status(uuid2)
  end

  test "Plugin test no RPC, singleton, keep using" do
    component = "serverboards.test.auth/fake_singleton"
    Logger.debug(inspect(component))
    {:ok, uuid} = Serverboards.Plugin.Runner.start(component, "test")

    :timer.sleep(800)
    Serverboards.Plugin.Runner.call(uuid, "dir", [])
    :timer.sleep(800)
    Serverboards.Plugin.Runner.call(uuid, "dir", [])
    :timer.sleep(800)
    # Should have not stopped in bg, if start same uuid
    {:ok, uuid2} = Serverboards.Plugin.Runner.start(component, "test")
    assert uuid2 == uuid
  end

  test "Can start/call/stop plugins" do
    {:ok, client} = Client.start_link(as: "dmoreno@serverboards.io")

    assert Client.call(client, "plugin.is_running", ["garbage"]) == {:ok, false}

    {:ok, test_cmd} = Client.call(client, "plugin.start", ["serverboards.test.auth/fake"])
    assert Client.call(client, "plugin.call", [test_cmd, "ping"]) == {:ok, "pong"}

    assert Client.call(client, "plugin.is_running", [test_cmd]) == {:ok, true}
    assert Client.call(client, "plugin.stop", [test_cmd]) == {:ok, true}
    assert Client.call(client, "plugin.is_running", [test_cmd]) == {:ok, false}

    assert Client.call(client, "plugin.call", [test_cmd, "ping"]) == {:error, "unknown_plugin"}
  end

  test "Dir after login at plugins" do
    {:ok, client} = Client.start_link(as: "dmoreno@serverboards.io")

    {:ok, dir} = Client.call(client, "dir", [])
    assert dir != []
    assert Enum.member?(dir, "ping")
  end

  test "Bad protocol" do
    {:ok, client} = Client.start_link(as: "dmoreno@serverboards.io")

    {:ok, pl} = Client.call(client, "plugin.start", ["serverboards.test.auth/fake"])

    # .bad_protocol writes garbage to protocol, but its logged and ignored.
    # Client (TestClient) could decide to close connection if needed.
    assert Client.call(client, "plugin.call", [pl, "bad_protocol", []]) == {:ok, true}

    # All keeps working as normal.
    assert Client.call(client, "plugin.call", [pl, "ping", []]) == {:ok, "pong"}

    Client.stop(client)
  end

  test "Plugin call with full method definition and filtering" do
    {:ok, cmd} = Serverboards.Plugin.Runner.start("serverboards.test.auth/fake", "test")

    res =
      Serverboards.Plugin.Runner.call(
        cmd,
        %{"method" => "pingm", "params" => [%{"name" => "message"}]},
        %{"message" => "Pong!", "ingored" => "ignore me"}
      )

    assert res == {:ok, "Pong!"}
  end

  test "Plugin singleton fail, relaunch" do
    {:ok, cmd} = Serverboards.Plugin.Runner.start("serverboards.test.auth/fake_singleton", "test")

    res = Serverboards.Plugin.Runner.call(cmd, "ping")
    assert res == {:ok, "pong"}

    assert {:ok, cmd} ==
             Serverboards.Plugin.Runner.start("serverboards.test.auth/fake_singleton", "test")

    table = :ets.new(:test_check, [:set, :public])

    MOM.Channel.subscribe(:plugin_down, fn %{payload: %{uuid: uuid, id: id}} ->
      Logger.warn("Process is DOWN: #{uuid}, #{id}")
      :ets.insert(table, {:down, true})
    end)

    # will fail always. first error, next bad id. (has a timeout to remove the uuid)
    res = Serverboards.Plugin.Runner.call(cmd, "abort", [])
    assert res == {:error, :exit}
    res = Serverboards.Plugin.Runner.call(cmd, "abort", [])
    assert res == {:error, :exit}
    res = Serverboards.Plugin.Runner.call(cmd, "abort", [])
    assert res == {:error, :exit}

    :timer.sleep(2000)
    assert :ets.lookup(table, :down) == [{:down, true}]

    # If ask restart, it does, with other uuid
    {:ok, cmd2} =
      Serverboards.Plugin.Runner.start("serverboards.test.auth/fake_singleton", "test")

    assert cmd2 != cmd

    # and works
    res = Serverboards.Plugin.Runner.call(cmd2, "ping", "ping")
    assert res == {:ok, "pong"}
  end

  test "Call to plugin name, various scenarios" do
    assert {:ok, "pong"} ==
             Serverboards.Plugin.Runner.call("serverboards.test.auth/fake", "ping", [], "test")

    assert {:error, :exit} ==
             Serverboards.Plugin.Runner.call("serverboards.test.auth/fake", "abort", [], "test")

    assert {:error, "Exception requested"} ==
             Serverboards.Plugin.Runner.call(
               "serverboards.test.auth/fake",
               "exception",
               [],
               "test"
             )

    assert {:error, :not_found} ==
             Serverboards.Plugin.Runner.call(
               "serverboards.test.auth/fake--XX",
               "anything",
               [],
               "test"
             )
  end

  test "Can call directly by plugin id" do
    {:ok, client} = Client.start_link(as: "dmoreno@serverboards.io")

    {:ok, list} = Client.call(client, "plugin.call", ["serverboards.test.auth/fake", "dir"])

    Logger.debug("list #{inspect(list)}")

    assert Enum.count(list) > 1
  end

  test "Call directly with custom permission" do
    # create user without permissions, to avoid `plugin` perm
    :ok =
      Serverboards.Auth.User.user_add(
        %{
          email: "noperms@serverboards.io",
          name: "No permissions",
          is_active: true
        },
        Test.User.system()
      )

    # Log in as that user
    {:ok, client} = Client.start_link(as: "noperms@serverboards.io", perms: [])
    user = MOM.RPC.Client.get(client, :user)
    assert user.perms == []

    assert {:error, :unknown_method} ==
             Client.call(client, "plugin.call", ["serverboards.test.auth/custom.perm", "ping", []])

    Client.stop(client)

    {:ok, client} = Client.start_link(as: "noperms@serverboards.io", perms: ["auth_ping"])

    assert {:ok, "pong"} ==
             Client.call(client, "plugin.call", ["serverboards.test.auth/custom.perm", "ping", []])

    Client.stop(client)

    {:ok, client} = Client.start_link(as: "noperms@serverboards.io", perms: ["auth_ping"])

    assert {:error, :unknown_method} ==
             Client.call(client, "plugin.call", [
               "serverboards.test.auth/custom.perm2",
               "ping",
               []
             ])

    Client.stop(client)

    {:ok, client} =
      Client.start_link(as: "noperms@serverboards.io", perms: ["auth_ping", "auth_pong"])

    assert {:ok, "pong"} ==
             Client.call(client, "plugin.call", [
               "serverboards.test.auth/custom.perm2",
               "ping",
               []
             ])

    Client.stop(client)
  end
end
