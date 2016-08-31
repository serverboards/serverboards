defmodule Serverboards do
  def start(_type, _args) do
    # inspect for deadletters and invalid
    MOM.Tap.tap(:deadletter, "deadletter")
    MOM.Tap.tap(:invalid, "invalid")

    {:ok, pid} = Serverboards.Setup.start
    Serverboards.Setup.update
    Serverboards.Setup.exit(pid)

    res = Serverboards.Supervisor.start_link name: Serverboards.Supervisor
    res
  end
end
