require Logger

defmodule IoCmd do
	use GenServer

	@doc ~S"""
	Runs a command (to properly shlex), and returns the handler to be able to
	comunicate with it

		iex> {:ok, ls} = IoCmd.start_link("test/ls/ls.py")
		iex> IoCmd.call( ls, "ls", ["."])
		[".gitignore", "test", "lib", "mix.exs", "config", "README.md"]
		iex> IoCmd.call( ls, "ls", ["."])
		[".gitignore", "test", "lib", "mix.exs", "config", "README.md"]

	"""
	def start_link(cmd, opts \\ []) do
		GenServer.start_link(__MODULE__, cmd, opts)
	end

	def init(cmd) do
		fullcmd="#{System.cwd}/#{cmd}"
		port = Port.open({:spawn_executable, cmd}, [:stream, :line, :use_stdio])
		Logger.debug("Starting command #{fullcmd} at port #{inspect port}")
		Port.connect(port, self())

		state=%{
			cmd: cmd,
			port: port,
			msgid: 0, # increases on each new message
			waiting: %{}, # msgid we are still waiting answer from, and port to send it
		}
		{:ok, state}
	end

	@doc ~S"""
	Blocking call to the given process, returns the result.
	"""
	def call(server, method, params) do
		Logger.debug("Calling #{method}(#{inspect params})")
		GenServer.call(server, {:call, %{ method: method, params: params}})
	end

	def handle_call({:call, msg}, from, %{ msgid: msgid, waiting: waiting, port: port } = state) do
		{:ok, json} = JSON.encode( Map.put( msg, :id, msgid ) ) # FIXME id has to change over time
		state=%{state | msgid: msgid+1, waiting: Map.put(waiting, msgid, from) }
		#Logger.debug("Calling #{inspect state.port} method with this json: #{json}")
		# Send command and \n
		Port.command(port, "#{json}\n")

		{:noreply, state}
	end

	def handle_cast(msg, state) do
		Logger.debug("Got cast  #{inspect msg}")
		{:noreply, state}
	end

	def handle_info({ port, {:data, {:eol, json}}}, state) do

		{:ok, msg} = JSON.decode( json )
		state = case msg do
			%{"result" => result, "id" => msgid} -> # response
				to = Map.get(state.waiting, msgid)
				Logger.debug("Answer is #{inspect result} for id #{msgid}")
				GenServer.reply(to, result)
				%{ state | waiting: Map.drop(state.waiting, [msgid]) }
				state
			%{"method" => method, "params" => params} -> # new call, async
				Logger.debug("No broadcast messages yet")
				state
			other ->
				Logger.debug("Dont know how to process #{inspect msg}")
				state
		end
    {:noreply, state}
  end
end
