require Logger

defmodule InitTest do
  use ExUnit.Case, async: false
  # @moduletag :capture_log

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
    {:ok, pid} = Serverboards.Plugin.Init.Supervisor.start_init(init)
    :timer.sleep(100)
    assert Serverboards.Plugin.Runner.status(init.command) == :running
    :timer.sleep(1500)
    # timeout, plugin runner killed the command
    assert Serverboards.Plugin.Runner.status(init.command) == :not_running
    :timer.sleep(1200)
    # and timeout to recover it (min 1s)
    Logger.debug("Ready? normally was 2s wait")
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
      id: "test.reload"
    }

    {:ok, pid} = Serverboards.Plugin.Init.Supervisor.start_init(init)
    :timer.sleep(100)

    Serverboards.Event.emit("plugins.reloaded", [])
    :timer.sleep(100)

    # still running, it issued a stop (not kill), it will timeout anyway later
    psux = :os.cmd('ps ux | grep -v grep | grep init2.py')
    Logger.debug("#{inspect psux}")
    assert psux != []

    # as it is not a real init, was started manually, should have been removed,
    # and not started
    :timer.sleep(900)
    psux = :os.cmd('ps ux | grep -v grep | grep init2.py')
    Logger.debug("#{inspect psux}")
    assert psux == []

  end
end
