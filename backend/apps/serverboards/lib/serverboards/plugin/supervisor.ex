defmodule Serverboards.Plugin.Supervisor do
  def start_link(options \\ []) do
    import Supervisor.Spec

    children = [
      worker(Serverboards.Plugin.Registry, [[name: Serverboards.Plugin.Registry]]),
      worker(Serverboards.Plugin.Runner, [[name: Serverboards.Plugin.Runner]]),
      worker(Serverboards.Plugin.Data, [[name: Serverboards.Plugin.Data]]),
      worker(Serverboards.Plugin.Monitor, [[name: Serverboards.Plugin.Monitor]])
    ]

    Supervisor.start_link(children, [strategy: :one_for_one] ++ options)
  end
end
