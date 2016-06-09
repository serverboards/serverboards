defmodule Serverboards do
  def start(_type, _args) do
    import Supervisor.Spec


    # inspect for deadletters and invalid
    MOM.Tap.tap(:deadletter, "deadletter")
    MOM.Tap.tap(:invalid, "invalid")

    Serverboards.Supervisor.start_link name: Serverboards.Supervisor
  end

  def config_change(changed, _new, removed) do
    Serverboards.HTTP.Endpoint.config_change(changed, removed)
    :ok
  end
end
