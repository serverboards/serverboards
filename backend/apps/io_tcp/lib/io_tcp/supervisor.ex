require Logger

defmodule IoTcp.Supervisor do
	use Supervisor

	def start_link do
		Supervisor.start_link(__MODULE__, :ok)
	end

	def init(:ok) do
		Logger.info("Starting TCP supervisor")

		 children=[
			 worker(IoTcp, [IoTcp, 4040] )
		 ]

		 supervisor(children, strategy: :one_for_one)
	end
end
