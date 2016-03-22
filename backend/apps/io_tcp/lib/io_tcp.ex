require Logger
require JSON

defmodule Serverboards.IoTcp do
	use Application
	alias Serverboards.{IoTcp, Router, Peer}

	def start(_type, _args) do
		import Supervisor.Spec

		{:ok, client} = Router.Peer.start_link

		children = [
			supervisor(Task.Supervisor, [[name: Serverboards.IoTcp.TaskSupervisor]]),
			worker(Task, [IoTcp, :accept, [client, 4040]])
		]

		opts = [strategy: :one_for_one, name: Serverboards.IoTcp.Supervisor]

		Supervisor.start_link(children, opts)
	end

	def accept(client, port) do
		{:ok, socket} = :gen_tcp.listen(port,
		 	[:binary, packet: :line, active: false, reuseaddr: true])
		Logger.info("Accepting TCP connections at #{port}")

		loop_acceptor(client, socket)
	end

	def close(socket) do
		:gen_tcp.close(socket)
	end

	def loop_acceptor(client, listen_socket) do
		case :gen_tcp.accept(listen_socket) do
			{:ok, client_socket} ->
				{:ok, pid} = Task.Supervisor.start_child(Serverboards.IoTcp.TaskSupervisor,
					fn -> Serverboards.IoTcp.serve(client, client_socket) end)
			  :ok = :gen_tcp.controlling_process(client, pid)

				#serve(client, client)
				loop_acceptor(client, listen_socket)
			{:error, :closed } ->
				nil
		end
	end

	def serve(client, socket) do
		case :gen_tcp.recv(socket, 0) do
			{:ok, line} ->
				#Logger.debug("Got data #{line}")
				{:ok, %{ "method" => method, "params" => params, "id" => id}} = JSON.decode(line)

				#Logger.debug("Found #{inspect {callable,method}}")

				res=Peer.call(client, method, params)
				{:ok, res}=JSON.encode( %{ "result" => res, "id" => id})
				#Logger.debug("Got answer #{res}, writing to #{inspect socket}")

				:gen_tcp.send(socket, res <> "\n")

				serve(client, socket)
			{:error, :closed} ->
				nil
		end
	end
end
