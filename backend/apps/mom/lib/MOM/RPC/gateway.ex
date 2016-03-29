require Logger

defmodule Serverboards.MOM.RPC.Gateway do
	@moduledoc ~S"""
	Gateway adapter for RPC. Creates a command and a response channel, which
	has to be connected to a RPC processor.

	## Example of use

	It can be used in a blocking fasion

		iex> alias Serverboards.MOM.{Message, Channel, RPC}
		iex> {:ok, rpc} = RPC.Gateway.start_link
		iex> Channel.subscribe(rpc.request, fn msg ->
		...>  Channel.send(msg.reply_to, %Message{ payload: msg.payload.params, id: msg.id })
		...> 	:ok
		...> 	end) # dirty echo rpc.
		iex> RPC.Gateway.call(rpc, "echo", "Hello world!", 1)
		"Hello world!"

	Or non blocking

		iex> alias Serverboards.MOM.{Message, Channel, RPC}
		iex> require Logger
		iex> {:ok, rpc} = RPC.Gateway.start_link
		iex> Channel.subscribe(rpc.request, fn msg -> Channel.send(msg.reply_to, %Message{ payload: msg.payload.params, id: msg.id }) end) # dirty echo rpc.
		iex> task_id = RPC.Gateway.cast(rpc, "echo", "Hello world!", 1, fn answer -> Logger.info("Got the answer: #{answer}") end)
		iex> # do something...
		iex> RPC.Gateway.await(rpc, task_id)
		:ok

	Returns exception when method does not exist

		iex> alias Serverboards.MOM.{Message, Channel, RPC}
		iex> {:ok, rpc} = RPC.Gateway.start_link
		iex> RPC.Gateway.call(rpc, "echo", "Hello world!", 1)
		** (Serverboards.MOM.RPC.Gateway.UnknownMethod) unknown method "echo"

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

	alias Serverboards.MOM.{Channel, Message, RPC}

	def start_link() do
		{:ok, pid} = GenServer.start_link(__MODULE__, :ok, [])

		{:ok, request} = Channel.PointToPoint.start_link
		{:ok, reply} = Channel.PointToPoint.start_link
		reply_id = Channel.subscribe(reply, &GenServer.cast( pid, {:reply, &1} ) )
		rpc = %RPC.Gateway{
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
			payload: %RPC.Message{
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
			payload: %RPC.Message{
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

	@doc ~S"""
	Adds a method to be answered by this RPC.

	Options:
		async: [true|false] -- Use a task to make it async. True by default.

	## Example

		iex> alias Serverboards.MOM.RPC.Gateway
		iex> {:ok, rpc} = Gateway.start_link
		iex> Gateway.add_method rpc, "echo", &(&1)
		iex> Gateway.call(rpc, "echo", "Hello", 1)
		"Hello"

	Sync mode

		iex> alias Serverboards.MOM.RPC.Gateway
		iex> {:ok, rpc} = Gateway.start_link
		iex> Gateway.add_method rpc, "echo", &(&1), async: false
		iex> Gateway.call(rpc, "echo", "Hello", 2)
		"Hello"
	"""
	def add_method(rpc, method, f, options \\ []) do
		Channel.subscribe(rpc.request, fn msg ->
			Logger.debug("Check method: #{msg.payload.method} #{method}")
			if msg.payload.method == method do
				execute_and_reply = fn ->
					reply = %Message{
						payload: f.(msg.payload.params),
						id: msg.id
					}
					Channel.send(msg.reply_to, reply)
				end

				if Keyword.get(options, :async, true) do
					Task.async( execute_and_reply )
				else
					execute_and_reply.()
				end
				:ok
			else
				:nok
			end
		end)
		:ok
	end

	@doc ~S"""
	Chains orig to dest so that requests to orig will be requested at dest and
	if replied, answered at orig too.

	This allows to have several RPC gateways for diferent functionality, and
	call a "parent" gateway that will try execution on each.
	"""
	def chain(orig, dest) do
		{
			Channel.subscribe(orig.request, dest.request, front: true),
			Channel.subscribe(dest.reply, orig.reply, front: true)
		}
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
				_ ->
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
