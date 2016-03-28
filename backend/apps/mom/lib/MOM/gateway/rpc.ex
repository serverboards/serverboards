defmodule Serverboards.MOM.Gateway.RPC do
	@moduledoc ~S"""
	Gateway adapter for RPC. Creates a command and a response channel, which
	has to be connected to a RPC processor.

	## Example of use:

	It can be used in a blocking fasion

		iex> alias Serverboards.MOM.{Gateway, Message, Channel}
		iex> {:ok, rpc} = Gateway.RPC.start_link
		iex> Channel.subscribe(rpc.to_mom, fn msg -> Channel.send(msg.reply_to, %Message{ payload: msg.payload.params, id: msg.id }) end) # dirty echo rpc.
		iex> Gateway.RPC.call(rpc, "echo", "Hello world!", 1)
		"Hello world!"


	Or non blocking

		iex> alias Serverboards.MOM.{Gateway, Message, Channel}
		iex> require Logger
		iex> {:ok, rpc} = Gateway.RPC.start_link
		iex> Channel.subscribe(rpc.to_mom, fn msg -> Channel.send(msg.reply_to, %Message{ payload: msg.payload.params, id: msg.id }) end) # dirty echo rpc.
		iex> task_id = Gateway.RPC.cast(rpc, "echo", "Hello world!", 1, fn answer -> Logger.info("Got the answer: #{answer}") end)
		iex> # do something...
		iex> Gateway.RPC.await(rpc, task_id)
		:ok

	"""

	use GenServer
	defstruct [
		to_mom: nil, # gets inside the MOM,
		from_mom: nil, # gets out of the MOM.
		uuid: nil,
		pid: nil,
		reply_id: nil, # subscription for reply, to unsubscribe
	]

	alias Serverboards.MOM.{Channel, Message, Gateway}

	def start_link() do
		{:ok, pid} = GenServer.start_link(__MODULE__, :ok, [])

		{:ok, to_mom} = Channel.start_link
		{:ok, from_mom} = Channel.start_link
		reply_id = Channel.subscribe(from_mom, &GenServer.cast( pid, {:reply, &1} ) )
		rpc = %Gateway.RPC{
			to_mom: to_mom,
			from_mom: from_mom,
			uuid: UUID.uuid4(),
			pid: pid,
			reply_id: reply_id,
		}

		{:ok, rpc}
	end

	def call(rpc, method, params, id) do
		GenServer.call( rpc.pid, { :call, rpc.to_mom, %Message{
			reply_to: rpc.from_mom,
			id: id,
			payload: %Message.RPC{
				method: method,
				params: params,
				}
			} } )
	end

	def cast(rpc, method, params, id, cb) do
		GenServer.cast( rpc.pid, { :call, rpc.to_mom, %Message{
			reply_to: rpc.from_mom,
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
		:ok = Channel.send(channel, message)
		if message.id do
			{:noreply, Map.put( status, message.id, &GenServer.reply(from, &1) ) }
		else
			{:reply, from, status}
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
		if message.id do
			reply_to = Map.get(status, message.id)
			reply_to.( message.payload )
		else
			raise "This channel only accepts responses"
		end
		{:noreply, Map.delete(status, message.id) }
	end
end
