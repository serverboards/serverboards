require Logger

defmodule Serverboards.LoggerTest do
  use ExUnit.Case
  @moduletag :capture_log

  test "Simple formatting" do
    metadata =  [file: "app/serverboards/logger/logger.ex", line: 32, level: :debug, timestamp: Logger.Utils.timestamp(true), pid: self]
    IO.puts Serverboards.Logger.Console.format("Message", metadata, Serverboards.Logger.Console.colors)

    metadata =  [file: "app/serverboards/logger/logger.ex", line: 32, level: :error, timestamp: Logger.Utils.timestamp(true), pid: self]
    IO.puts Serverboards.Logger.Console.format("Message", metadata, Serverboards.Logger.Console.colors)
  end
end
