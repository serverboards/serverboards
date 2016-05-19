defmodule Serverboards do
	def start(_type, _args) do
		import Supervisor.Spec

		children = [
			supervisor(Serverboards.Repo, []),
			supervisor(Task.Supervisor, [[name: Serverboards.IO.TaskSupervisor]]),
			worker(Task, [Serverboards.IO.TCP, :accept, [4040]]),
			worker(Serverboards.IO.HTTP, [:start_link, [8080]]),
			worker(Serverboards.Auth, [:start_link, []]),
			worker(Serverboards.Plugin.Registry, [ [name: Serverboards.Plugin.Registry] ]),
			worker(Serverboards.Plugin.Runner, [ [name: Serverboards.Plugin.Runner] ]),
			worker(Serverboards.Serverboard, [ [name: Serverboards.Serverboard] ]),
			worker(Serverboards.Service, [ [name: Serverboards.Service] ]),
		]

		opts = [strategy: :one_for_one, name: Serverboards.Supervisor]

		# inspect for deadletters and invalid
		MOM.Tap.tap(:deadletter, "deadletter")
		MOM.Tap.tap(:invalid, "invalid")
		Serverboards.Events.setup()

		Supervisor.start_link(children, opts)
	end

	def config_change(changed, _new, removed) do
    Serverboards.HTTP.Endpoint.config_change(changed, removed)
    :ok
  end
end
