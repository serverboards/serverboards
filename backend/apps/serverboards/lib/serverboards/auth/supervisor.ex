defmodule Serverboards.Auth.Supervisor do
  import Supervisor.Spec

  def start_link(_options \\ [] ) do
    children = [
      worker(Serverboards.Auth, [:start_link, []]),
      worker(Serverboards.Auth.RPC, [:start_link, []]),
    ]

    Supervisor.start_link(children, strategy: :one_for_one)
  end
end
