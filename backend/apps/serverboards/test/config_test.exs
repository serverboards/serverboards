require Logger

defmodule Serverboards.ConfigTest do
  use ExUnit.Case
  @moduletag :capture_log

  setup do
    # Explicitly get a connection before each test
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(Serverboards.Repo)
    # Setting the shared mode must be done only after checkout
    Ecto.Adapters.SQL.Sandbox.mode(Serverboards.Repo, {:shared, self()})
  end

  test "Test simple config" do
    System.put_env("SERVERBOARDS_TEST_ENV", "true")
    assert Serverboards.Config.get(:invalid) == []
    test = Serverboards.Config.get(:test)
    Logger.debug(inspect test)
    assert test[:env]
    assert test[:ini]
    assert test[:config_file]
    assert test[:echo] == "echo"
    System.put_env("SERVERBOARDS_TEST_ENV", "false")
    test = Serverboards.Config.get(:test)
    assert test[:env] == false
    System.delete_env("SERVERBOARDS_TEST_ENV")
  end

  test "Test change database get new values" do
    Serverboards.Settings.update("test", %{ db: true }, Test.User.system)
    :timer.sleep(100)
    test = Serverboards.Config.get(:test)
    Logger.debug(inspect test)
    assert test[:db] == true

    Serverboards.Settings.update("test", %{ db: false }, Test.User.system)
    :timer.sleep(100)
    test = Serverboards.Config.get(:test)
    Logger.debug(inspect test)
    assert test[:db] == false
  end

  test "Priorities" do
    Serverboards.Settings.update("test", %{ at: "db", at2: "db" }, Test.User.system)
    System.put_env("SERVERBOARDS_TEST_AT", "env")

    #Serverboards.Config.get(:test, [at: :default]) |> IO.inspect

    assert Serverboards.Config.get(:test, [at: :default])[:at] == "env"
    System.delete_env("SERVERBOARDS_TEST_AT")
    assert Serverboards.Config.get(:test, [at: :default])[:at] == "ini"
    assert Serverboards.Config.get(:test, [at2: :default])[:at2] == "db"
    assert Serverboards.Config.get(:test, [at3: :default])[:at3] == :econfig
    assert Serverboards.Config.get(:test, [at4: :default])[:at4] == :default
  end

  test "NULL values and simple get" do
    System.put_env("SERVERBOARDS_TEST_AT", "null")
    assert Serverboards.Config.get(:test, :at, :default) == nil
    assert Serverboards.Config.get(:test, :atx, :default) == :default  # there was a bug for atom defaults when reached
    System.delete_env("SERVERBOARDS_TEST_AT")
  end

  test "Really removed envvars" do
    assert System.get_env("TERM") == nil
    assert System.get_env("USERNAME") == nil
    Logger.debug("#{inspect System.get_env()}")
    assert Enum.count(System.get_env()) == 5
  end
end
