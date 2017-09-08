require Logger

defmodule Serverboards.LoggerTest do
  use ExUnit.Case
  @moduletag :capture_log

  setup do
    # Explicitly get a connection before each test
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(Serverboards.Repo)
    # Setting the shared mode must be done only after checkout
    Ecto.Adapters.SQL.Sandbox.mode(Serverboards.Repo, {:shared, self()})
  end

  test "Simple formatting" do
    metadata =  [file: "app/serverboards/logger/logger.ex", line: 32, level: :debug, timestamp: Logger.Utils.timestamp(true), pid: self()]
    IO.puts Serverboards.Logger.Console.format("Message", metadata, Serverboards.Logger.Console.colors, true)

    metadata =  [file: "app/serverboards/logger/logger.ex", line: 32, level: :error, timestamp: Logger.Utils.timestamp(true), pid: self()]
    IO.puts Serverboards.Logger.Console.format("Message", metadata, Serverboards.Logger.Console.colors, false)
  end

  test "Get history" do
    {:ok, history} = Serverboards.Logger.history %{}
    assert Enum.count(history) <= 50

    Logger.debug("History debug: #{inspect Enum.count(history)}")

    {:ok, history} = Serverboards.Logger.history %{count: 10}
    assert Enum.count(history) <= 10
  end

  test "Get history, filter by service and q" do
    Logger.remove_backend(Serverboards.Logger)
    Logger.add_backend(Serverboards.Logger, [])

    {:ok, user} = Serverboards.Auth.User.user_info("dmoreno@serverboards.io")
    {:ok, uuid} = Serverboards.Service.service_add %{ "name" => "Test service", "tags" => ~w(tag1 tag2 tag3), "type" => "aabb" }, user

    Logger.flush

    {:ok, history} = Serverboards.Logger.history %{service: uuid}
    #Logger.info("History debug: #{inspect history}")
    #Logger.info("History debug: #{inspect Enum.count(history.lines)}")

    assert Enum.count(history.lines) > 0
    assert Enum.count(history.lines) <= 50

    {:ok, history} = Serverboards.Logger.history %{count: 10}
    assert Enum.count(history) <= 10

    # check by query

    {:ok, history} = Serverboards.Logger.history %{q: "Test service Serverboards.Service"}
    Logger.debug("History debug: #{inspect history}")
    Logger.debug("History debug: #{inspect Enum.count(history.lines)}")

    assert Enum.count(history.lines) > 0
    assert Enum.count(history.lines) <= 50

    {:ok, history} = Serverboards.Logger.history %{q: "Test service Serverboards.Service #{UUID.uuid4}"}
    # Logger.info("History debug: #{inspect history}")
    # Logger.info("History debug: #{inspect Enum.count(history.lines)}")

    assert Enum.count(history.lines) == 0

    {:ok, history} = Serverboards.Logger.history %{count: 10}
    assert Enum.count(history) <= 10



    Logger.remove_backend(Serverboards.Logger)
  end

end
