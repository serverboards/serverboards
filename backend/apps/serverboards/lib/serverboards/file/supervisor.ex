require Logger

defmodule Serverboards.File.Supervisor do
  def start_link( opts ) do
    import Supervisor.Spec
    children = [
      supervisor(Registry, [:unique, Serverboards.File.Pipe]),
      worker(Serverboards.File.RPC, [[name: Serverboards.File.RPC]]),
    ]

    Logger.debug("Starting file  supervisor")
    Supervisor.start_link(children, [strategy: :one_for_one] ++ opts)
  end
end
