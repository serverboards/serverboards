require Logger

defmodule Serverboards.Auth.Supervisor do
  import Supervisor.Spec

  def start_link(options \\ [] ) do
    children = [
      worker(Serverboards.Auth.RPC, [:start_link, []]),
      worker(Serverboards.Auth.EventSourcing, [])
    ]

    Supervisor.start_link(children, [strategy: :one_for_one] ++ options)
  end
end

defmodule Serverboards.Auth.EventSourcing do
  def start_link do
    {:ok, es } = EventSourcing.start_link name: Serverboards.Auth.EventSourcing

    EventSourcing.Model.subscribe es, Serverboards.Auth.EventSourcing, Serverboards.Repo
    EventSourcing.subscribe es, :debug_full

    Serverboards.Auth.User.setup_eventsourcing(es)
    Serverboards.Auth.Group.setup_eventsourcing(es)

    {:ok, es}
  end
end
