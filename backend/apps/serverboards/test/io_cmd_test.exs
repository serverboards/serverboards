require Logger

defmodule Serverboards.IO.CmdTest do
  use ExUnit.Case
  @moduletag :capture_log

  doctest Serverboards.IO.Cmd, import: true

  setup do
    # Explicitly get a connection before each test
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(Serverboards.Repo)
    # Setting the shared mode must be done only after checkout
    Ecto.Adapters.SQL.Sandbox.mode(Serverboards.Repo, {:shared, self()})
  end

  @tag timeout: 2_000
  test "Rate limit" do
    {:ok, rl} = Serverboards.IO.Cmd.start_link("test/data/plugins/auth/auth.py")
    init = Timex.Duration.now()
    {:ok, :ok} = Serverboards.IO.Cmd.call(rl, "test_rate_limiting", [150])
    total_t = Timex.Duration.elapsed(init)

    # depends on default timerates at cmd.ex.
    assert total_t > 1000
  end
end
