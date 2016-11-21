require Logger

defmodule Serverboards do
  def start(_type, _args) do
    # inspect for deadletters and invalid
    MOM.Tap.tap(:deadletter, "deadletter")
    MOM.Tap.tap(:invalid, "invalid")

    {:ok, pid} = Serverboards.Setup.start
    Serverboards.Setup.update
    Serverboards.Setup.exit(pid)
    wait_pid(pid)

    setup_logger()

    res = Serverboards.Supervisor.start_link name: Serverboards.Supervisor
    res
  end

  def setup_logger() do
    if Serverboards.Config.get(:logs, "systemd", false) do
      Logger.add_backend(Logger.Backend.Journald, [])
    end
    if Serverboards.Config.get(:logs, "console", true) do
      Logger.add_backend(Serverboards.Logger.Console, [])
    end
    if Serverboards.Config.get(:logs, "classic", false) do
      Logger.add_backend(:console, [])
    end
  end

  defp wait_pid(nil), do: :ok
  defp wait_pid(pid) do
    if Process.alive?(pid) do
      :timer.sleep 100
      wait_pid(pid)
    else
      :ok
    end
  end
end
