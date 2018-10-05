require Logger

defmodule Serverboards.PluginDataTest do
  use ExUnit.Case
  @moduletag :capture_log
  @moduletag timeout: 10_000

  :ok = Application.ensure_started(:serverboards)

  alias Test.Client

  setup_all do
    # Explicitly get a connection before each test
    Test.Ecto.setup()
  end

  test "List plugin components using RPC" do
    {:ok, client} = Client.start_link as: "dmoreno@serverboards.io"
    {:ok, list} = Client.call(client, "plugin.catalog", [])
    assert (Enum.count(list)) > 0
    Logger.debug("Got #{Enum.count list} plugins")

    {:ok, list} = Client.call(client, "plugin.component.catalog", [])
    Logger.debug("Got #{Enum.count list} components")
    assert (Enum.count(list)) > 0

    {:ok, list} = Client.call(client, "plugin.component.catalog", %{ type: "action" })
    Logger.debug("Got #{Enum.count list} action components")
    assert (Enum.count(list)) > 0

    {:ok, list} = Client.call(client, "plugin.component.catalog", %{ type: "action template" })
    Logger.debug("Got #{Enum.count list} action template components")
    assert (Enum.count(list)) >= 0
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

  test "Plugin data from plugin, simplified" do
    {:ok, client} = Client.start_link as: "dmoreno@serverboards.io"

    {:ok, test_cmd} = Client.call(client, "plugin.start", ["serverboards.test.auth/fake"])
    assert Client.call(client, "plugin.call",
      [
        test_cmd,
        "data_sets",
        ["k", %{test: true} ]
       ]) == {:ok, true}
    assert Client.call(client, "plugin.stop", [test_cmd]) == {:ok, true}

    {:ok, test_cmd} = Client.call(client, "plugin.start", ["serverboards.test.auth/fake"])
    assert Client.call(client, "plugin.call",
      [
        test_cmd,
        "data_gets",
        ["k"]
      ]
    ) == {:ok, %{ "test" => true }}
    assert Client.call(client, "plugin.stop", [test_cmd]) == {:ok, true}
  end

  test "Plugin data from plugin, wrong plugin" do
    {:ok, client} = Client.start_link as: "dmoreno@serverboards.io"

    {:ok, test_cmd} = Client.call(client, "plugin.start", ["serverboards.test.auth/fake"])
    assert Client.call(client, "plugin.call",
      [
        test_cmd,
        "data_sete",
        ["k", %{test: true} ]
       ]) == {:error, "not_allowed"}
    assert Client.call(client, "plugin.stop", [test_cmd]) == {:ok, true}

    {:ok, test_cmd} = Client.call(client, "plugin.start", ["serverboards.test.auth/fake"])
    assert Client.call(client, "plugin.call",
      [
        test_cmd,
        "data_gete",
        ["k"]
      ]
    ) == {:error, "not_allowed"}
    assert Client.call(client, "plugin.stop", [test_cmd]) == {:ok, true}
  end

  test "Plugin data get items via RPC" do
    # there was a bug when changing from JSON to Poison, it does not convert tuples to lists
    {:ok, client} = Client.start_link as: "dmoreno@serverboards.io"

    {:ok, _} = Client.call(client, "plugin.data.update", ["serverboards.test.auth/fake", "test", "value"])
    {:ok, _} = Client.call(client, "plugin.data.update", ["serverboards.test.auth/fake", "test2", "value"])
    {:ok, keys} = Client.call(client, "plugin.data.list", ["serverboards.test.auth/fake", ""])
    Logger.debug(inspect keys)

    {:ok, items} = Client.call(client, "plugin.data.items", ["serverboards.test.auth/fake", ""])
    Logger.debug(inspect items)
  end

  test "Plugin list" do
    {:ok, client} = Client.start_link as: "dmoreno@serverboards.io"

    {:ok, list} = Client.call(client, "plugin.catalog", [])
    Logger.debug("#{inspect list}")
    assert Map.get list, "serverboards.test.auth", false
  end

  @tag skip: "FIXME. The enable/disable of plugins has changed and is s10s dependant. But still needs to figure out optional core components."
  test "Plugin is active" do
    {:ok, client} = Client.start_link as: "dmoreno@serverboards.io"

    {:ok, list} = Client.call(client, "plugin.catalog", [])
    assert "active" in list["serverboards.test.auth"]["status"]
    assert not "disabled" in list["serverboards.test.auth"]["status"]

    {:ok, :ok} = Client.call(client, "settings.update", ["plugins", "serverboards.test.auth", false])
    Logger.debug("Settings updated")
    context = Serverboards.Config.get(:plugins)
    Logger.debug("At context: #{inspect context} #{inspect context[:"serverboards.test.auth"]}")

    :timer.sleep(200) # time to reload
    context = Serverboards.Config.get(:plugins)
    Logger.debug("At context: #{inspect context} #{inspect context[:"serverboards.test.auth"]}")
    assert context[:"serverboards.test.auth"] == false

    {:ok, list} = Client.call(client, "plugin.catalog", [])
    Logger.debug("#{inspect list}")

    assert not "active" in list["serverboards.test.auth"]["status"]
    assert "disabled" in list["serverboards.test.auth"]["status"]

    assert not "serverboards.test.auth" in Serverboards.Plugin.Registry.active_plugins()

    Client.call(client, "settings.update", ["plugins", "serverboards.test.auth", true])
    {:ok, list} = Client.call(client, "plugin.catalog", [])
    assert "active" in list["serverboards.test.auth"]["status"]
    assert not "disabled" in list["serverboards.test.auth"]["status"]
  end
end
