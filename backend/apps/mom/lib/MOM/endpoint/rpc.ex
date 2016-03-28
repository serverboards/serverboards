defmodule Serverboards.MOM.Endpoint.RPC do
	@moduledoc ~S"""
	Endpoint adapter for RPC. Creates a command and a response channel, which
	has to be connected to a RPC processor.

	Example of use:

		iex> alias Serverboards.MOM.{Endpoint, Message, Channel}
		iex> {:ok, rpc} = Endpoint.RPC.start_link
		iex> Channel.subscribe(rpc.to_mom, fn msg -> Channel.send(msg.reply_to, %Message{ payload: msg.payload.params, id: msg.id }) end) # dirty echo rpc.
		iex> Endpoint.RPC.call(rpc, "echo", "Hello world!", 1)
		"Hello world!"
	"""

	use GenServer
	defstruct [
		to_mom: nil, # gets inside the MOM,
		from_mom: nil, # gets out of the MOM.
		uuid: nil,
		pid: nil,
		reply_id: nil, # subscription for reply, to unsubscribe
	]

	alias Serverboards.MOM.{Channel, Message, Endpoint}

	def start_link() do
		{:ok, pid} = GenServer.start_link(__MODULE__, :ok, [])

		{:ok, to_mom} = Channel.start_link
		{:ok, from_mom} = Channel.start_link
		reply_id = Channel.subscribe(from_mom, &GenServer.cast( pid, {:reply, &1} ) )
		rpc = %Endpoint.RPC{
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

	## Server impl

	def init(:ok) do
		{:ok, %{}}
	end

	def handle_call({:call, channel, message}, from, status) do
		:ok = Channel.send(channel, message)
		if message.id do
			{:noreply, Map.put( status, message.id, from )}
		else
			{:reply, from, status}
		end
	end

	def handle_cast({:reply, message}, status) do
		if message.id do
			reply_to = Map.get(status, message.id)
			GenServer.reply(reply_to, message.payload)
		else
			raise "This channel only accepts responses"
		end
		{:noreply, Map.delete(status, message.id) }
	end
end
