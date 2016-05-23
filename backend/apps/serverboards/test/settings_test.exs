require Logger

defmodule Serverboards.SettingsTest do
  use ExUnit.Case
  @moduletag :capture_log

  doctest Serverboards.Settings, import: true

  test "Get base fields" do
    user = Serverboards.Test.User.system

    settings = Serverboards.Settings.all_settings(user)
    Logger.info("#{inspect settings}")
    assert (hd (hd settings)[:fields])[:value] != "https://test.serverboards.io"

    :ok = Serverboards.Settings.update((hd settings)[:id], %{ base_url: "https://test.serverboards.io"}, user)
    settings = Serverboards.Settings.all_settings(user)
    Logger.info("#{inspect settings}")

    assert (hd (hd settings)[:fields])["value"] == "https://test.serverboards.io"
  end

  test "Cant recover password" do
    user = Serverboards.Test.User.system

    settings = Serverboards.Settings.all_settings(user)
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

    {:ok, _} = Test.Client.call(client, "settings.all", [])
    {:ok, :ok} = Test.Client.call(client, "settings.update", [
      "serverboards.test.auth/settings",
      %{ test_pw: "https://test.serverboards.io"}]
      )
  end
end
