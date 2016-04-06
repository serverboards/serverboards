require Logger

defmodule Serverboards.Plugin.Registry do
  def start_link do
    plugins = Serverboards.Plugin.Parser.read_dir("test/data/plugins/")

    pid = Agent.start_link __MODULE__, plugins, []

    Logger.debug("Got plugins #{inspect plugins}")

    pid
  end
end
