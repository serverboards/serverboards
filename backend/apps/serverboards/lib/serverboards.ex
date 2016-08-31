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

    Logger.debug("And now the rest")

    res = Serverboards.Supervisor.start_link name: Serverboards.Supervisor
    res
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
