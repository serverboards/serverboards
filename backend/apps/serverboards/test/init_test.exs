require Logger

defmodule InitTest do
  use ExUnit.Case, async: false
  #@moduletag :capture_log

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
      id: "test init"
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
      id: "test fail"
    }
    Serverboards.Plugin.Init.Supervisor.start_init(init)
    :timer.sleep(100)
    assert Serverboards.Plugin.Runner.status(init.command) == :running
    :timer.sleep(1500)
    assert Serverboards.Plugin.Runner.status(init.command) == :not_running
  end

  test "Init reloads when plugins are modified" do
    init = %Serverboards.Plugin.Init{
      command: "serverboards.test.auth/init.cmd2",
      call: "init",
      id: "test reload"
    }

    Serverboards.Plugin.Init.Supervisor.start_init(init)
    :timer.sleep(100)

    Serverboards.Event.emit("plugins_reload", [])
    :timer.sleep(100)

    # it is not a real init, was started manually, should have been removed,
    # and not started
    psux = :os.cmd('ps ux | grep -v grep | grep init2.py')
    Logger.debug("#{inspect psux}")
    assert psux == []

  end
end
