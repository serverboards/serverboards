require Logger

defmodule Serverboards.RulesV2.Rule do
  def start_link(rule, options \\ []) do

    GenServer.start_link(__MODULE__, rule, options)
  end

  def init(rule) do
    Logger.info("Starting rule #{inspect rule}")

    {:ok, %{}}
  end
end
