require Logger

defmodule Serverboards.Supervisor do
	use Supervisor

	def start_link(opts) do
		Supervisor.start_link(__MODULE__, :ok, opts)
	end

	def init(:ok) do
		Logger.info("Starting Serverboards supervisor")

		 children=[
			 worker(Serverboards.IO.TCP, [Serverboards.IO.TCP, 4040] )
		 ]

		 supervisor(children, strategy: :one_for_one)
	end
end
