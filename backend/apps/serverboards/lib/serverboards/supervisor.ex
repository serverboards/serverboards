require Logger

defmodule Serverboards.Supervisor do
  use Supervisor

  def start_link(opts) do
    Supervisor.start_link(__MODULE__, :ok, opts)
  end

  def init(:ok) do
    Logger.info("Starting Serverboards supervisor")

    children = [
      supervisor(Serverboards.Repo, []),
      supervisor(Task.Supervisor, [[name: Serverboards.IO.TaskSupervisor]]),
      worker(Task, [Serverboards.IO.TCP, :accept, [4040]]),
      worker(Serverboards.Settings, [ [name: Serverboards.Settings] ]),
      worker(Serverboards.IO.HTTP, [:start_link, [8080]]),
      worker(Serverboards.Auth, [:start_link, []]),
      worker(Serverboards.Plugin.Registry, [ [name: Serverboards.Plugin.Registry] ]),
      worker(Serverboards.Plugin.Runner, [ [name: Serverboards.Plugin.Runner] ]),
      worker(Serverboards.Plugin.Data, [ [name: Serverboards.Plugin.Data] ]),
      worker(Serverboards.Serverboard, [ [name: Serverboards.Serverboard] ]),
      worker(Serverboards.Service, [ [name: Serverboards.Service] ]),
      worker(Serverboards.Event, [ [name: Serverboards.Event] ]),
      worker(Serverboards.Action, [ [name: Serverboards.Action] ]),
      worker(Serverboards.Notifications, [ [name: Serverboards.Notifications] ]),
      worker(Serverboards.Rules.Trigger, [ [name: Serverboards.Rules.Trigger] ]),
      worker(Serverboards.Rules, [ [name: Serverboards.Rules] ]),
      worker(Serverboards.Logger.RPC, [ [name: Serverboards.Logger.RPC] ]),
    ]

    opts = [strategy: :one_for_one]

    supervise(children, opts)
  end
end
