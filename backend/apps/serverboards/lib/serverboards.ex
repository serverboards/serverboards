defmodule Serverboards do
	def start(_type, _args) do
		import Supervisor.Spec

		children = [
			supervisor(Serverboards.Auth.Repo, []),
			supervisor(Task.Supervisor, [[name: Serverboards.IO.TaskSupervisor]]),
			worker(Task, [Serverboards.IO.TCP, :accept, [4040]]),
			worker(Serverboards.Auth, [:start_link, []])
		]

		opts = [strategy: :one_for_one, name: Serverboards.Supervisor]

		# inspect for deadletters and invalid
		Serverboards.MOM.Tap.tap(:deadletter, "deadletter")
		Serverboards.MOM.Tap.tap(:invalid, "invalid")

		Supervisor.start_link(children, opts)
	end

end
