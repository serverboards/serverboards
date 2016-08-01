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
      supervisor(Serverboards.IO.Cmd.Supervisor, [[name: Serverboards.IO.Cmd.Supervisor]]),
      worker(Serverboards.Settings, [ [name: Serverboards.Settings] ]),
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

    run_servers = (System.get_env("SERVERBOARDS_SERVER") || "true") == "true"
    Logger.debug("Run servers #{inspect run_servers} #{(System.get_env("SERVERBOARDS_SERVER") || "true") == "true"}")

    children = if run_servers do
      tcp = Application.get_env(:serverboards, :tcp, 4040)
      http = Application.get_env(:serverboards, :http, 8080)
      [
        worker(Task, [Serverboards.IO.TCP, :accept, tcp]),
        worker(Serverboards.IO.HTTP, [:start_link, http]),
      ] ++  children
    else
      children
    end

    opts = [strategy: :one_for_one]

    supervise(children, opts)
  end
end
