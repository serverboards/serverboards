require Logger
require JSON

defmodule Serverboards.IO.TCP do
	use Application

	alias Serverboards.IO

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
				{:ok, pid} = Task.Supervisor.start_child(Serverboards.IO.TCP.TaskSupervisor,
					fn ->
						{:ok, client} = IO.Client.start_link(name: "TCP")

						IO.Client.on_call(
							client, :to_client,
							&call_to_client(client_socket, &1, &2, &3)
							)

						IO.TCP.serve(client, client_socket)
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
				case JSON.decode(line) do
					{:ok, %{ "method" => method, "params" => params, "id" => id}} ->
						IO.Client.call(client, :to_serverboards, method, params, id, &reply(socket, id, &1))
					{:ok, %{ "method" => method, "params" => params}} ->
						IO.Client.event(client, :to_serverboards, method, params)
					{:ok, %{ "result" => result, "id" => id}} ->
						IO.Client.reply(client, :to_client, result, id)
					{:ok, %{ "error" => params, "id" => id}} ->
						raise Protocol.UndefinedError, "No errors yet. Closing."
						:ok
					_ ->
						Logger.debug("Invalid message from client: #{line}")
						raise Protocol.UndefinedError, "Invalid message from client. Closing."
				end

				#Logger.debug("RPC call #{inspect method} #{inspect params} #{inspect id}")

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

	def call_to_client(socket, method, params, id) do
		jmsg = %{ method: method, params: params }

		# maybe has id, maybe not.
		jmsg = if id do
			%{ jmsg | id: id }
		else
			jmsg
		end

		# encode and send
		{:ok, json} = JSON.encode( jmsg )
		:gen_tcp.send(socket, json <> "\n")
	end
end
