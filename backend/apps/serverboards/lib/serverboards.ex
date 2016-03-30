defmodule Serverboards do
	def start(_type, _args) do
		import Supervisor.Spec

		children = [
			supervisor(Task.Supervisor, [[name: Serverboards.IO.TCP.TaskSupervisor]]),
			worker(Task, [Serverboards.IO.TCP, :accept, [4040]])
		]

		opts = [strategy: :one_for_one, name: Serverboards.IO.TCP.Supervisor]

		# inspect for deadletters and invalid
		Serverboards.MOM.Tap.tap(:deadletter, "deadletter")
		Serverboards.MOM.Tap.tap(:invalid, "invalid")

		Supervisor.start_link(children, opts)
	end

end
