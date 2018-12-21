require Logger

defmodule Serverboards.Project.Supervisor do
  def start_link(options \\ []) do
    import Supervisor.Spec

    children = [
      worker(Serverboards.Project.RPC, [[name: Serverboards.Project.RPC]]),
      worker(Serverboards.Project, [[]])
    ]

    Supervisor.start_link(
      children,
      [strategy: :one_for_one, name: Serverboards.Project.Supervisor] ++ options
    )
  end
end
