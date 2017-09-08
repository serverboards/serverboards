require Logger

defmodule Serverboards.IO.TCP do
	alias MOM.RPC

	def start_accept() do
		port = Serverboards.Config.get(:tcp, :port, 4040)
		if port  do
			start_accept(port)
		else
			Logger.warn("Not listening TCP")
			:ok
		end
	end

	def start_accept(port) do
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
				{:ok, _pid} = Task.Supervisor.start_child(Serverboards.IO.TaskSupervisor,
					fn ->
						{:ok, client} = RPC.Client.start_link [
							writef: &:gen_tcp.send(client_socket, &1),
							name: "TCP",
						]
						Serverboards.Auth.authenticate(client)

						serve(client, client_socket)
					end)

			  #:ok = :gen_tcp.controlling_process(client, pid)

				#serve(client, client)
				loop_acceptor(listen_socket)
			{:error, :closed } ->
				nil
		end
	end

	def serve(client, socket) do
		case :gen_tcp.recv(socket, 0) do
			{:ok, "\n"} ->
				# empty line, ignore
				serve(client, socket)
			{:ok, line} ->
				RPC.Client.parse_line(client, line)
				serve(client, socket)
			{:error, :closed} ->
				RPC.Client.stop(client)
				nil
		end
	end
end
