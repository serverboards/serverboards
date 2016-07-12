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
    metadata =  [file: "app/serverboards/logger/logger.ex", line: 32, level: :debug, timestamp: Logger.Utils.timestamp(true), pid: self]
    IO.puts Serverboards.Logger.Console.format("Message", metadata, Serverboards.Logger.Console.colors)

    metadata =  [file: "app/serverboards/logger/logger.ex", line: 32, level: :error, timestamp: Logger.Utils.timestamp(true), pid: self]
    IO.puts Serverboards.Logger.Console.format("Message", metadata, Serverboards.Logger.Console.colors)
  end

  test "Get history" do
    {:ok, history} = Serverboards.Logger.history %{}
    assert Enum.count(history) <= 50

    Logger.debug("History debug: #{inspect Enum.count(history)}")

    {:ok, history} = Serverboards.Logger.history %{count: 10}
    assert Enum.count(history) <= 10
  end
end
