defmodule Serverboards.IO.HTTP.Supervisor do
  def start_link(options \\ []) do
    import Supervisor.Spec
    children = [
      worker(Serverboards.IO.HTTP, [ [name: Serverboards.IO.HTTP] ], restart: :transient),
      worker(Serverboards.IO.HTTP.PortToWebsocket, []),
      worker(Serverboards.IO.HTTP.RPC, [])
    ]

    Supervisor.start_link(children, strategy: :one_for_one)

  end
end
