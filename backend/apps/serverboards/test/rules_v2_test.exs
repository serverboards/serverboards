require Logger

defmodule Serverboards.RuleV2Test do
  use ExUnit.Case
  @moduletag :capture_log

  alias Serverboards.Rules.RulesV2

  setup do
    # Explicitly get a connection before each test
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(Serverboards.Repo)
    # Setting the shared mode must be done only after checkout
    Ecto.Adapters.SQL.Sandbox.mode(Serverboards.Repo, {:shared, self()})
  end

  test "Create rule v2" do

  end
end
