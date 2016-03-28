require Logger
require JSON

defmodule Serverboards.Io.Tcp do
	use Application
	alias Serverboards.{Io.Tcp, MOM}

	def accept(port) do
		{:ok, socket} = :gen_tcp.listen(port,
		 	[:binary, packet: :line, active: false, reuseaddr: true])
		Logger.info("Accepting TCP connections at #{port}")

		loop_acceptor(socket)
	end

	def close(socket) do
		:gen_tcp.close(socket)
	end

	def loop_acceptor(listen_socket) do
		case :gen_tcp.accept(listen_socket) do
			{:ok, client_socket} ->
				{:ok, pid} = Task.Supervisor.start_child(Serverboards.Io.Tcp.TaskSupervisor,
					fn ->
						{:ok, client} = MOM.Endpoint.RPC.start_link
						setup_client(client)

						Serverboards.Io.Tcp.serve(client, client_socket)
					end)

			  #:ok = :gen_tcp.controlling_process(client, pid)

				#serve(client, client)
				loop_acceptor(listen_socket)
			{:error, :closed } ->
				nil
		end
	end

	def tap(client) do
		MOM.Tap.tap(client.to_mom, "->")
		MOM.Tap.tap(client.from_mom, "<-")
	end

	def setup_client(client) do
		tap(client)

		import MOM.Endpoint.RPC

		"""
		add_method client, "version" do
			"0.0.1"
		end

		add_method client, "authenticate" do
			params=%{}
			if params.username == "test" and params.password == "test" do
				add_router client, "plugins", Plugin.Endpoint.RPC.start_link
			end
		end
		"""
		:ok
	end

	def serve(client, socket) do
		alias MOM.Endpoint.RPC

		case :gen_tcp.recv(socket, 0) do
			{:ok, line} ->
				Logger.debug("Got data #{line}")
				{:ok, %{ "method" => method, "params" => params, "id" => id}} = JSON.decode(line)

				Logger.debug("RPC call #{inspect method} #{inspect params} #{inspect id}")

				res=RPC.cast(client, method, params, id, &reply(client, id, &1))

				serve(client, socket)
			{:error, :closed} ->
				nil
		end
	end

	def reply(socket, id, res) do
		{:ok, res}=JSON.encode( %{ "result" => res, "id" => id})
		#Logger.debug("Got answer #{res}, writing to #{inspect socket}")

		:gen_tcp.send(socket, res <> "\n")
	end
end
