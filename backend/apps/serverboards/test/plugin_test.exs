require Logger

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

  setup do
    # Explicitly get a connection before each test
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(Serverboards.Repo)
    # Setting the shared mode must be done only after checkout
    Ecto.Adapters.SQL.Sandbox.mode(Serverboards.Repo, {:shared, self()})
  end

  test "Plugin test no RPC, singleton" do
    component = "serverboards.test.auth/fake_singleton"
    {:ok, uuid} = Serverboards.Plugin.Runner.start component
    # If start again, same uuid
    assert {:ok, uuid} == Serverboards.Plugin.Runner.start component
    assert {:error, :cant_stop} == Serverboards.Plugin.Runner.stop uuid
    # If start again, same uuid
    {:ok, ^uuid} = Serverboards.Plugin.Runner.start component

    :timer.sleep(1500)
    # Should have stopped in bg, if start new uuid
    {:ok, uuid2} = Serverboards.Plugin.Runner.start component
    assert uuid2 != uuid
  end

  test "Plugin test no RPC, one_for_one, timeout" do
    component = "serverboards.test.auth/fake_one_for_one"
    {:ok, uuid1} = Serverboards.Plugin.Runner.start component
    # If start again, another uuid, still running
    {:ok, uuid2} = Serverboards.Plugin.Runner.start component
    assert uuid1 != uuid2
    assert :running == Serverboards.Plugin.Runner.status uuid1
    assert :running == Serverboards.Plugin.Runner.status uuid2
    # stop 1
    true = Serverboards.Plugin.Runner.stop uuid1
    assert :not_running == Serverboards.Plugin.Runner.status uuid1
    assert :running == Serverboards.Plugin.Runner.status uuid2
    # If start again, same uuid
    :timer.sleep(1500)
    assert :not_running == Serverboards.Plugin.Runner.status uuid2
  end
  test "Plugin test no RPC, init is already running" do
    component = "serverboards.test.auth/fake_init"
    {:ok, uuid} = Serverboards.Plugin.Runner.start component
    {:ok, ^uuid} = Serverboards.Plugin.Runner.start component
    assert {:error, :cant_stop} == Serverboards.Plugin.Runner.stop uuid
    assert {:error, :cant_stop} == Serverboards.Plugin.Runner.stop uuid
    assert {:error, :cant_stop} == Serverboards.Plugin.Runner.stop uuid
    :timer.sleep(800)
    assert {:error, :cant_stop} == Serverboards.Plugin.Runner.stop uuid
    assert {:ok, uuid} == Serverboards.Plugin.Runner.start component
  end

  test "Plugin test no RPC, singleton, keep using" do
    component = "serverboards.test.auth/fake_singleton"
    Logger.debug(inspect component)
    {:ok, uuid} = Serverboards.Plugin.Runner.start component

    :timer.sleep(800)
    Serverboards.Plugin.Runner.call uuid, "dir", []
    :timer.sleep(800)
    Serverboards.Plugin.Runner.call uuid, "dir", []
    :timer.sleep(800)
    # Should have not stopped in bg, if start same uuid
    {:ok, uuid2} = Serverboards.Plugin.Runner.start component
    assert uuid2 == uuid
  end

  test "Can start/call/stop plugins" do
    {:ok, client} = Client.start_link as: "dmoreno@serverboards.io"

    assert Client.call(client, "plugin.is_running", ["garbage"]) == {:ok, false}

    {:ok, test_cmd} = Client.call(client, "plugin.start", ["serverboards.test.auth/fake"])
    :timer.sleep 300
    assert Client.call(client, "plugin.call", [test_cmd, "ping"]) == {:ok, "pong"}

    assert Client.call(client, "plugin.is_running", [test_cmd]) == {:ok, true}
    assert Client.call(client, "plugin.stop", [test_cmd]) == {:ok, true}
    assert Client.call(client, "plugin.is_running", [test_cmd]) == {:ok, false}

    assert Client.call(client, "plugin.call", [test_cmd, "ping"]) == {:error, :unknown_method}

    # Fallback UUID caller
    require Logger
    Logger.info("UUID Caller")
    {:ok, test_cmd} = Client.call(client, "plugin.start", ["serverboards.test.auth/fake"])
    assert Client.call(client, "#{test_cmd}.ping", []) == {:ok, "pong"}
    assert Client.call(client, "plugin.stop", [test_cmd]) == {:ok, true}
    assert Client.call(client, "#{test_cmd}.ping", []) == {:error, :unknown_method}
  end

  test "Set alias" do
    {:ok, client} = Client.start_link as: "dmoreno@serverboards.io"

    {:ok, test_cmd} = Client.call(client, "plugin.start", ["serverboards.test.auth/fake"])
    assert Client.call(client, "plugin.alias", [test_cmd, "test"]) == {:ok, true}
    assert Client.call(client, "test.ping", []) == {:ok, "pong"}
    assert Client.call(client, "plugin.stop", [test_cmd]) == {:ok, true}
    assert Client.call(client, "#{test_cmd}.ping", []) == {:error, :unknown_method}
    assert Client.call(client, "test.ping", []) == {:error, :unknown_method}
  end

  test "List plugin components using RPC" do
    {:ok, client} = Client.start_link as: "dmoreno@serverboards.io"
    {:ok, list} = Client.call(client, "plugin.list", [])
    assert (Enum.count(list)) > 0
    Logger.debug("Got #{Enum.count list} plugins")

    {:ok, list} = Client.call(client, "plugin.list_components", [])
    Logger.debug("Got #{Enum.count list} components")
    assert (Enum.count(list)) > 0

    {:ok, list} = Client.call(client, "plugin.list_components", [ type: "action" ])
    Logger.debug("Got #{Enum.count list} action components")
    assert (Enum.count(list)) > 0

    {:ok, list} = Client.call(client, "plugin.list_components", [ type: "action template" ])
    Logger.debug("Got #{Enum.count list} action template components")
    assert (Enum.count(list)) >= 0
  end

  test "Dir after login at plugins" do
    {:ok, client} = Client.start_link as: "dmoreno@serverboards.io"

    {:ok, dir} = Client.call(client, "dir", [])
    assert dir != []
    assert Enum.member? dir, "ping"


    {:ok, test_cmd1} = Client.call(client, "plugin.start", ["serverboards.test.auth/fake"])
    {:ok, test_cmd2} = Client.call(client, "plugin.start", ["serverboards.test.auth/fake"])
    Client.call(client, "plugin.alias", [test_cmd1, "test"])
    {:ok, dir} = Client.call(client, "dir", [])
    Logger.info (inspect dir)
    assert dir != []
    assert not (Enum.member? dir, test_cmd1<>".ping")
    assert Enum.member? dir, "test.ping"

    # after stop, must not be there.
    Client.call(client, "plugin.stop", [test_cmd1])
    Client.call(client, "plugin.stop", [test_cmd2])
    {:ok, dir} = Client.call(client, "dir", [])
    assert not (Enum.member? dir, test_cmd1<>".ping")
    assert not (Enum.member? dir, "test.ping")
  end

  test "Plugin list" do
    {:ok, client} = Client.start_link as: "dmoreno@serverboards.io"

    {:ok, list} = Client.call(client, "plugin.list", [])
    Logger.debug("#{inspect list}")
    assert Map.get list, "serverboards.test.auth", false
  end

  test "Bad protocol" do
    {:ok, client} = Client.start_link as: "dmoreno@serverboards.io"

    {:ok, pl} = Client.call(client, "plugin.start", ["serverboards.test.auth/fake"])

    # .bad_protocol writes garbage to protocol, but its logged and ignored.
    # Client (TestClient) could decide to close connection if needed.
    assert Client.call(client, pl<>".bad_protocol", []) == {:ok, true}

    # All keeps working as normal.
    assert Client.call(client, pl<>".ping", []) == {:ok, "pong"}

    Client.stop(client)
  end

  test "Plugin data" do
    :ok = Serverboards.Plugin.Data.data_set "test.plugin.data", "key", %{ data: "data"}, Test.User.system

    data = Serverboards.Plugin.Data.data_get "test.plugin.data", "key"
    assert data["data"] == "data"

    # get by prefix
    keys = Serverboards.Plugin.Data.data_keys "test.plugin.data", "k"
    assert keys == ["key"]

    # remove
    Serverboards.Plugin.Data.data_remove "test.plugin.data", "key", Test.User.system
    data = Serverboards.Plugin.Data.data_get "test.plugin.data", "key"
    assert %{} == data
  end

  test "Plugin data from plugin" do
    {:ok, client} = Client.start_link as: "dmoreno@serverboards.io"

    {:ok, test_cmd} = Client.call(client, "plugin.start", ["serverboards.test.auth/fake"])
    assert Client.call(client, "plugin.call",
      [
        test_cmd,
        "data_set",
        ["k", %{test: true} ]
       ]) == {:ok, true}
    assert Client.call(client, "plugin.stop", [test_cmd]) == {:ok, true}

    {:ok, test_cmd} = Client.call(client, "plugin.start", ["serverboards.test.auth/fake"])
    assert Client.call(client, "plugin.call",
      [
        test_cmd,
        "data_get",
        ["k"]
      ]
    ) == {:ok, %{ "test" => true }}
    assert Client.call(client, "plugin.stop", [test_cmd]) == {:ok, true}
  end

  test "Plugin call with full method definition and fitlering" do
    {:ok, cmd} = Serverboards.Plugin.Runner.start "serverboards.test.auth/fake"
    res = Serverboards.Plugin.Runner.call cmd, %{ "method" => "pingm", "params" => [ %{ "name" => "message" } ] }, %{ "message" => "Pong!", "ingored" => "ignore me"}
    assert res == {:ok, "Pong!"}
  end

  test "Plugin singleton fail, relaunch" do
    {:ok, cmd} = Serverboards.Plugin.Runner.start "serverboards.test.auth/fake_singleton"

    res = Serverboards.Plugin.Runner.call cmd, "ping"
    assert res == {:ok, "pong"}

    assert {:ok, cmd} == Serverboards.Plugin.Runner.start "serverboards.test.auth/fake_singleton"

    table = :ets.new(:test_check, [:set, :public])
    MOM.Channel.subscribe(:plugin_down, fn %{ payload: %{ uuid: uuid, id: id }} ->
      Logger.warn("Process is DOWN: #{uuid}, #{id}")
      :ets.insert(table, {:down, true})
    end)

    # will fail always. first error, next bad id. (has a timeout to remove the uuid)
    res = Serverboards.Plugin.Runner.call cmd, "abort", []
    assert res == {:error, :exit}
    res = Serverboards.Plugin.Runner.call cmd, "abort", []
    assert res == {:error, :exit}
    res = Serverboards.Plugin.Runner.call cmd, "abort", []
    assert res == {:error, :exit}

    :timer.sleep(2000)
    assert :ets.lookup(table, :down) == [{:down,true}]

    # If ask restart, it does, with other uuid
    {:ok, cmd2} = Serverboards.Plugin.Runner.start "serverboards.test.auth/fake_singleton"
    assert cmd2 != cmd

    # and works
    res = Serverboards.Plugin.Runner.call cmd2, "ping", "ping"
    assert res == {:ok, "pong"}
  end

  test "Start call stop, various scenarios" do
    assert {:ok, "pong"} == Serverboards.Plugin.Runner.start_call_stop("serverboards.test.auth/fake", "ping")
    assert {:error, :exit} == Serverboards.Plugin.Runner.start_call_stop("serverboards.test.auth/fake", "abort")
    assert {:error, "Exception requested"} == Serverboards.Plugin.Runner.start_call_stop("serverboards.test.auth/fake", "exception")
    assert {:error, :not_found} == Serverboards.Plugin.Runner.start_call_stop("serverboards.test.auth/fake--XX", "anything")
  end
end
