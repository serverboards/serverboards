defmodule Serverboards do
  def start(_type, _args) do
    # inspect for deadletters and invalid
    MOM.Tap.tap(:deadletter, "deadletter")
    MOM.Tap.tap(:invalid, "invalid")

    Serverboards.Supervisor.start_link name: Serverboards.Supervisor
  end
end
