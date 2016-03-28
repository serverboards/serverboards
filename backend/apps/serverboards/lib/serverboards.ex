defmodule Serverboards do
	def start(_type, _args) do
		import Supervisor.Spec

		children = [
			supervisor(Task.Supervisor, [[name: Serverboards.Io.Tcp.TaskSupervisor]]),
			worker(Task, [Serverboards.Io.Tcp, :accept, [4040]])
		]

		opts = [strategy: :one_for_one, name: Serverboards.Io.Tcp.Supervisor]

		Supervisor.start_link(children, opts)
	end

end
