require Logger
require JSON

defmodule Serverboards.IoTcp do
	use Application
	alias Serverboards.{IoTcp, Router, Peer}

	def start(_type, _args) do
		import Supervisor.Spec

		{:ok, router} = Router.Basic.start_link

		children = [
			worker(Task, [IoTcp, :accept, [router, 4040]])
		]

		opts = [strategy: :one_for_one, name: IoTcp.Supervisor]

		Supervisor.start_link(children, opts)
	end

	def accept(router, port) do
		{:ok, socket} = :gen_tcp.listen(port,
		 	[:binary, packet: :line, active: false, reuseaddr: true])
		Logger.info("Accepting TCP connections at #{port}")

		loop_acceptor(router, socket)
	end

	def close(socket) do
		:gen_tcp.close(socket)
	end

	def loop_acceptor(router, listen_socket) do
		case :gen_tcp.accept(listen_socket) do
			{:ok, client} ->
				serve(router, client)
				loop_acceptor(router, listen_socket)
			{:error, :closed } ->
				nil
		end
	end

	def serve(router, socket) do
		case :gen_tcp.recv(socket, 0) do
			{:ok, line} ->
				#Logger.debug("Got data #{line}")
				{:ok, %{ "method" => method, "params" => params, "id" => id}} = JSON.decode(line)
				{:ok, callable, method} = Router.lookup(router, method)

				#Logger.debug("Found #{inspect {callable,method}}")

				res=Peer.call(callable, method, params)
				{:ok, res}=JSON.encode( %{ "result" => res, "id" => id})
				#Logger.debug("Got answer #{res}, writing to #{inspect socket}")

				:gen_tcp.send(socket, res <> "\n")

				serve(router, socket)
			{:error, :closed} ->
				nil
		end
	end
end
