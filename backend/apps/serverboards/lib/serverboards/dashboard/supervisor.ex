require Logger

defmodule Serverboards.Dashboard.Supervisor do
  def start_link(options \\ []) do
    import Supervisor.Spec

    children=[
      worker(Serverboards.Dashboard.RPC, [[name: Serverboards.Dashboard.RPC]]),
      worker(Serverboards.Dashboard, [[]]),
    ]

    Supervisor.start_link(children, [strategy: :one_for_one, name: Serverboards.Dashboard.Supervisor] ++ options)
  end

end
