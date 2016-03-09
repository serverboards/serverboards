require Logger

defmodule Serverboards.Router.Supervisor do
	use Supervisor

	def start_link do
		Supervisor.start_link(__MODULE__, :ok)
	end

	def init(:ok) do
		#Logger.debug("Starting router supervisor")

		 children=[
			 worker(Serverboards.Router, [Serverboards.Router] )
		 ]

		 supervise(children, strategy: :one_for_one)
	end
end
