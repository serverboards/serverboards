require Logger

defmodule InitTest do
  use ExUnit.Case, async: false
  @moduletag :capture_log

  alias Test.Client

  setup do
    # Explicitly get a connection before each test
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(Serverboards.Repo)
    # Setting the shared mode must be done only after checkout
    Ecto.Adapters.SQL.Sandbox.mode(Serverboards.Repo, {:shared, self()})
  end

  test "Run init" do
    init = %Serverboards.Plugin.Init{
      command: "serverboards.test.auth/init.cmd2",
      call: "init",
      id: "test"
    }

    # WARNING may fail as timers are a bit tight
    Serverboards.Plugin.Init.Supervisor.start_init(init)
    :timer.sleep(100)
    assert Serverboards.Plugin.Runner.status(init.command) == :running
    :timer.sleep(1500)
    assert Serverboards.Plugin.Runner.status(init.command) == :not_running
    :timer.sleep(1200)
    assert Serverboards.Plugin.Runner.status(init.command) == :running
  end

  test "Run failing init" do
    init = %Serverboards.Plugin.Init{
      command: "serverboards.test.auth/init.cmd2",
      call: "fail",
      id: "test"
    }
    Serverboards.Plugin.Init.Supervisor.start_init(init)
    :timer.sleep(100)
    assert Serverboards.Plugin.Runner.status(init.command) == :running
    :timer.sleep(1500)
    assert Serverboards.Plugin.Runner.status(init.command) == :not_running
  end
end
