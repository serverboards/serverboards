require Logger

defmodule Serverboards.Supervisor do
  use Supervisor

  def start_link(opts) do
    Supervisor.start_link(__MODULE__, :ok, opts)
  end

  def init(:ok) do
    Logger.info("Starting Serverboards supervisor")
    database = Serverboards.Config.get( :database )

    children = [
      supervisor(Serverboards.Repo, [database]),
      supervisor(Task.Supervisor, [[name: Serverboards.IO.TaskSupervisor]]),
      supervisor(Serverboards.IO.Cmd.Supervisor, [[name: Serverboards.IO.Cmd.Supervisor]]),
      supervisor(Serverboards.Auth.Supervisor, []),
      supervisor(Serverboards.Issues, [ [name: Serverboards.Issues] ]),
      supervisor(Serverboards.IO.HTTP.Supervisor, [[name: Serverboards.IO.HTTP.Supervisor]]),
      supervisor(Serverboards.Plugin.Supervisor, [[name: Serverboards.Plugin.Supervisor]]),
      supervisor(Serverboards.Query.Cache, [[name: Serverboards.Query.Cache]]),

      worker(Serverboards.Settings, [ [name: Serverboards.Settings] ]),
      worker(Serverboards.Project, [ [name: Serverboards.Project] ]),
      worker(Serverboards.Service, [ [name: Serverboards.Service] ]),
      worker(Serverboards.Event, [ [name: Serverboards.Event] ]),
      worker(Serverboards.Action, [ [name: Serverboards.Action] ]),
      worker(Serverboards.Notifications, [ [name: Serverboards.Notifications] ]),
      worker(Serverboards.Logger.RPC, [ [name: Serverboards.Logger.RPC] ]),
      worker(Serverboards.Utils.MonitorCallbacks, [ [name: Serverboards.Utils.MonitorCallbacks] ]),
      worker(Serverboards.Query.RPC, [ [name: Serverboards.Query.RPC] ]),

      worker(Task, [Serverboards.IO.TCP, :start_accept, []], restart: :transient),

      # this should be the last, as it may use others
      # worker(Serverboards.Rules, [ [name: Serverboards.Rules] ]),
      supervisor(Serverboards.RulesV2.Supervisor, [ [name: Serverboards.RulesV2.Supervisor] ]),
      supervisor(Serverboards.Plugin.Init.Supervisor, [ [name: Serverboards.Plugin.Init.Supervisor] ]),
    ]

    opts = [strategy: :one_for_one, name: __MODULE__]

    supervise(children, opts)
  end
end
