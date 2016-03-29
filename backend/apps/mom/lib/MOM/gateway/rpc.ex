require Logger

defmodule Serverboards.MOM.Gateway.RPC do
	@moduledoc ~S"""
	Gateway adapter for RPC. Creates a command and a response channel, which
	has to be connected to a RPC processor.

	## Example of use

	It can be used in a blocking fasion

		iex> alias Serverboards.MOM.{Gateway, Message, Channel}
		iex> {:ok, rpc} = Gateway.RPC.start_link
		iex> Channel.subscribe(rpc.request, fn msg ->
		...>  Channel.send(msg.reply_to, %Message{ payload: msg.payload.params, id: msg.id })
		...> 	:ok
		...> 	end) # dirty echo rpc.
		iex> Gateway.RPC.call(rpc, "echo", "Hello world!", 1)
		"Hello world!"

	Or non blocking

		iex> alias Serverboards.MOM.{Gateway, Message, Channel}
		iex> require Logger
		iex> {:ok, rpc} = Gateway.RPC.start_link
		iex> Channel.subscribe(rpc.request, fn msg -> Channel.send(msg.reply_to, %Message{ payload: msg.payload.params, id: msg.id }) end) # dirty echo rpc.
		iex> task_id = Gateway.RPC.cast(rpc, "echo", "Hello world!", 1, fn answer -> Logger.info("Got the answer: #{answer}") end)
		iex> # do something...
		iex> Gateway.RPC.await(rpc, task_id)
		:ok

	Returns exception when method does not exist

		iex> alias Serverboards.MOM.{Gateway, Message, Channel}
		iex> {:ok, rpc} = Gateway.RPC.start_link
		iex> Gateway.RPC.call(rpc, "echo", "Hello world!", 1)
		** (Serverboards.MOM.Gateway.RPC.UnknownMethod) unknown method "echo"

	"""

	defmodule UnknownMethod do
		defexception [method: nil]

		def message(exception) do
			"unknown method #{inspect(exception.method)}"
		end
	end

	use GenServer
	defstruct [
		request: nil, # gets inside the MOM,
		reply: nil, # gets out of the MOM.
		uuid: nil,
		pid: nil,
		reply_id: nil, # subscription for reply, to unsubscribe
	]

	alias Serverboards.MOM.{Channel, Message, Gateway}

	def start_link() do
		{:ok, pid} = GenServer.start_link(__MODULE__, :ok, [])

		{:ok, request} = Channel.PointToPoint.start_link
		{:ok, reply} = Channel.PointToPoint.start_link
		reply_id = Channel.subscribe(reply, &GenServer.cast( pid, {:reply, &1} ) )
		rpc = %Gateway.RPC{
			request: request,
			reply: reply,
			uuid: UUID.uuid4(),
			pid: pid,
			reply_id: reply_id,
		}

		{:ok, rpc}
	end

	def call(rpc, method, params, id) do
		ok = GenServer.call( rpc.pid, { :call, rpc.request, %Message{
			reply_to: rpc.reply,
			id: id,
			payload: %Message.RPC{
				method: method,
				params: params,
				}
			} } )
		Logger.debug("#{inspect ok}")
		case ok do
			{:error, :unknown} -> raise UnknownMethod, method: method
			{:ok, ret} -> ret
			:ok -> nil
		end
	end

	def cast(rpc, method, params, id, cb) do
		GenServer.cast( rpc.pid, { :call, rpc.request, %Message{
			reply_to: rpc.reply,
			id: id,
			payload: %Message.RPC{
				method: method,
				params: params,
				}
			}, cb } )

		id
	end

	def await(rpc, task_id) do
		GenServer.call( rpc.pid, {:await, task_id} )
		:ok
	end

	## Server impl

	def init(:ok) do
		{:ok, %{}}
	end

	def handle_call({:call, channel, message}, from, status) do
		case Channel.send(channel, message) do
			:ok ->
				if message.id do
					status =
						Map.put( status, message.id, &( GenServer.reply(from, {:ok, &1} ) ) )
					{:noreply, status }
				else
					{:reply, :ok, status}
				end
			_ ->
				Logger.error("Method does not exist #{message.payload.method}")
				{:reply, {:error, :unknown}, status}
		end
	end

	def handle_call({:await, task_id}, from, status) do
		cb = Map.get(status, task_id)
		if cb do # if had callback, wake up my caller, and call it.
			{:noreply, Map.put( status, task_id, fn msg ->
				GenServer.reply(from, :done)
				cb.(msg)
			end)}
		else # if not, not waiting, just return
			{:reply, :done, status}
		end
	end

	def handle_cast({:call, channel, message, cb}, status) do
		:ok = Channel.send(channel, message)
		if message.id do
			{:noreply, Map.put(status, message.id, cb ) }
		else
			{:noreply, status}
		end

	end

	def handle_cast({:reply, message}, status) do
		reply_to = Map.get(status, message.id)
		if reply_to do
			try do
				reply_to.( message.payload )
			rescue
				e ->
					Logger.error("Error processing reply. Check :invalid channel.")
					Channel.send(:invalid, message)
			end
		else
			Logger.error("This channel only accepts responses. Check :invalid channel.")
			Channel.send(:invalid, message)
		end
		{:noreply, Map.delete(status, message.id) }
	end
end
