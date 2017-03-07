require Logger

defmodule Serverboards.SettingsTest do
  use ExUnit.Case
  @moduletag :capture_log

  doctest Serverboards.Settings, import: true

  setup do
    # Explicitly get a connection before each test
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(Serverboards.Repo)
    # Setting the shared mode must be done only after checkout
    Ecto.Adapters.SQL.Sandbox.mode(Serverboards.Repo, {:shared, self()})
  end

  test "Get base fields" do
    user = Test.User.system

    settings = Serverboards.Settings.all_settings(user)
    Logger.info("#{inspect settings}")
    assert (hd (hd settings)[:fields])[:value] != "https://test.serverboards.io"

    :ok = Serverboards.Settings.update((hd settings)[:id], %{ base_url: "https://test.serverboards.io"}, user)
    settings = Serverboards.Settings.all_settings(user)
    Logger.info("#{inspect settings}")

    assert (hd (hd settings)[:fields])["value"] == "https://test.serverboards.io"
  end

  test "Cant recover password" do
    user = Test.User.system

    _settings = Serverboards.Settings.all_settings(user)
    :ok = Serverboards.Settings.update(
      "serverboards.test.auth/settings",
      %{ test_pw: "https://test.serverboards.io"},
      user)

    settings = Serverboards.Settings.all_settings(user)
    Logger.info("#{inspect settings}")

    assert (hd (hd settings)[:fields])["test_pw"] != "https://test.serverboards.io"
  end

  test "Client use" do
    {:ok, client} = Test.Client.start_link as: "dmoreno@serverboards.io"

    {:ok, _} = Test.Client.call(client, "settings.list", [])
    {:ok, :ok} = Test.Client.call(client, "settings.update", [
      "serverboards.test.auth/settings",
      %{ test_pw: "https://test.serverboards.io"}]
      )
  end

  test "User data" do
    {:ok, client} = Test.Client.start_link as: "dmoreno@serverboards.io"

    assert {:ok, nil} == Test.Client.call(client, "settings.user.get", ["notifications"])
    assert {:ok, :ok} == Test.Client.call(client, "settings.user.set", ["notifications", %{ email: "dmoreno@serverboards.io"}] )
    :timer.sleep(200)
    assert {:ok, %{ "email" => "dmoreno@serverboards.io"}} == Test.Client.call(client, "settings.user.get", ["notifications"])

    assert {:ok, :ok} == Test.Client.call(client, "settings.user.set", ["notifications", nil] )
    :timer.sleep(200)
    assert {:ok, nil} == Test.Client.call(client, "settings.user.get", ["notifications"])
  end
end
