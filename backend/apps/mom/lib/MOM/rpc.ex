require Logger

defmodule Serverboards.MOM.RPC do
	@moduledoc ~S"""
	Gateway adapter for RPC.

	Creates a command and a response channel, which has to be connected to a RPC
	processor.

	It also has Method Caller lists to call directly and can be chained

	## Example of use

	It can be used in a blocking fasion

		iex> alias Serverboards.MOM.{Message, Channel, RPC}
		iex> {:ok, rpc} = RPC.start_link
		iex> Channel.subscribe(rpc.request, fn msg ->
		...>	Channel.send(msg.reply_to, %Message{ payload: msg.payload.params, id: msg.id })
		...> 	:ok
		...> 	end) # dirty echo rpc.
		iex> RPC.call(rpc, "echo", "Hello world!", 1)
		"Hello world!"

	Or non blocking

		iex> alias Serverboards.MOM.{Message, Channel, RPC}
		iex> require Logger
		iex> {:ok, rpc} = RPC.start_link
		iex> Channel.subscribe(rpc.request, fn msg -> Channel.send(msg.reply_to, %Message{ payload: msg.payload.params, id: msg.id }) end) # dirty echo rpc.
		iex> RPC.cast(rpc, "echo", "Hello world!", 1, fn answer -> Logger.info("Got the answer: #{answer}") end)
		:ok

	Returns exception when method does not exist

		iex> alias Serverboards.MOM.RPC
		iex> {:ok, rpc} = RPC.start_link
		iex> RPC.call(rpc, "echo", "Hello world!", 1)
		** (Serverboards.MOM.RPC.UnknownMethod) Unknown method "echo"

	"""
	alias Serverboards.MOM.{RPC, Tap}

	defmodule UnknownMethod do
		defexception [method: nil]

		def message(exception) do
			"Unknown method #{inspect(exception.method)}"
		end
	end

	use GenServer
	defstruct [
		request: nil, # gets inside the MOM,
		reply: nil, # gets out of the MOM.
		uuid: nil,
		pid: nil,
		reply_id: nil, # subscription for reply, to unsubscribe
		method_caller: nil,
	]

	alias Serverboards.MOM.{Channel, Message, RPC}

	def start_link() do
		{:ok, pid} = GenServer.start_link(__MODULE__, :ok, [])

		{:ok, request} = Channel.PointToPoint.start_link
		{:ok, reply} = Channel.PointToPoint.start_link
		{:ok, method_caller} = RPC.MethodCaller.start_link

		reply_id = Channel.subscribe(reply, &GenServer.cast( pid, {:reply, &1} ) )

		rpc = %RPC{
			request: request,
			reply: reply,
			uuid: UUID.uuid4(),
			pid: pid,
			reply_id: reply_id,
			method_caller: method_caller,
		}

		# When new request, do the calls and return on the reply channel
		Channel.subscribe(request, fn msg ->
			RPC.MethodCaller.cast(method_caller, msg.payload.method, msg.payload.params, fn
				{:ok, v} ->
					reply = %Message{
									payload: v,
									id: msg.id
					}
					Channel.send(msg.reply_to, reply)
					:ok
				{:error, :not_found} ->
					:nok
				{:error, e} ->
					reply = %Message{
						error: e,
						id: msg.id
					}
					Channel.send(msg.reply_to, reply)
					:ok
		 end) # returns :ok if has method, or :nok if not.
		end)

		{:ok, rpc}
	end



	def tap(%RPC{ uuid: uuid, request: request, reply: reply}, id \\ nil) do
		if id do
			Tap.tap(request, "#{id}>")
			Tap.tap(reply, "#{id}<")
		else
			Tap.tap(request, "#{uuid}>")
			Tap.tap(reply, "#{uuid}<")
		end
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
		Logger.debug("Result #{inspect ok}")
		case ok do
			{:error, :unknown_method} -> raise RPC.UnknownMethod, method: method
			{:error, :bad_arity} -> raise ClauseError
			{:ok, ret} -> ret
			:ok -> nil
		end
	end

	@doc ~S"""
	Performs an RPC call, but dont wait for processing.

	Callback will be called when the call is processed, with the answer.

	## Example

		iex> alias Serverboards.MOM.RPC
		iex> {:ok, rpc} = RPC.start_link
		iex> RPC.add_method rpc, "test", fn [] -> :ok end
		iex> RPC.cast(rpc, "test", [], 0, fn :ok -> :ok end)
		:ok

	If cast to a non existent method, returns :nok

		iex> alias Serverboards.MOM.RPC
		iex> {:ok, rpc} = RPC.start_link
		iex> RPC.cast(rpc, "test", [], 0, fn :ok -> :ok end)
		:nok

	"""
	def cast(rpc, method, params, id, cb) do
		GenServer.call( rpc.pid, { :cast, rpc.request, %Message{
			reply_to: if id do rpc.reply else nil end,
			id: id,
			payload: %RPC.Message{
				method: method,
				params: params,
				}
			}, cb } )
	end

	@doc ~S"""
	Sends an event to the RPC channels.

	An event is a method without id, and no answer.

	Always returns :ok. If nobody consumed it, it will appear at :invalid messages,
	if no receptor, at :deadletter

	## Example

		iex> alias Serverboards.MOM.RPC
		iex> {:ok, rpc} = RPC.start_link
		iex> RPC.event(rpc, "test", [])
		:ok

	"""
	def event(rpc, method, params) do
		cast(rpc, method, params, nil, nil)
		:ok
	end

	@doc ~S"""
	Adds a method to be answered by this RPC.

	Options:

	* `async:` [true|false] -- Use a task to make it async. True by default.

	An async method creates a Task for each invocation and performs the function
	body in it. If is a sync task the function is performed in the call moment in
	the message channel task, so it may block the channel. Use async tasks for
	small methods. Its always safer to use async.

	## Example

	Async mode, creates a new task to make the call.

		iex> import Serverboards.MOM.RPC
		iex> {:ok, rpc} = start_link
		iex> add_method rpc, "echo", &(&1)
		iex> call(rpc, "echo", "Hello", 1)
		"Hello"

	Sync mode

		iex> import Serverboards.MOM.RPC
		iex> {:ok, rpc} = start_link
		iex> add_method rpc, "echo", &(&1), async: false
		iex> call(rpc, "echo", "Hello", 2)
		"Hello"
	"""
	def add_method(rpc, method, f, options \\ []) do
		RPC.MethodCaller.add_method rpc.method_caller, method, f, options
	end

	@doc ~S"""
	Adds a method caller list.

	It is just a list of methods that can be called
	"""
	def add_method_caller(rpc, mc) do
		RPC.MethodCaller.add_method_caller( rpc.method_caller, mc )
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
						Map.put( status, message.id, &( GenServer.reply(from, &1) ) )
					{:noreply, status }
				else
					{:reply, :ok, status}
				end
			_ ->
				Logger.error("Method does not exist #{inspect message.payload.method}")
				{:reply, {:error, :unknown_method}, status}
		end
	end

	def handle_call({:cast, channel, message, cb}, _, status) do
		case Channel.send(channel, message) do
			:ok ->
				if message.id do
					{:reply, :ok, Map.put(status, message.id, cb ) }
				else
					{:reply, :ok, status}
				end
			:nok ->
				Logger.debug("Invalid method")
				#Channel.send(:invalid, message)
				{:reply, :nok, status}
			:empty ->
				Logger.debug("Empty channel")
				#Channel.send(:deadletter, message)
				{:reply, :nok, status}
		end
	end

	def handle_cast({:reply, message}, status) do
		Logger.debug("Got reply: #{inspect message}")
		f_reply_to = Map.get(status, message.id)
		if f_reply_to do
			try do
				case message.error do
					:unknown_method ->
						f_reply_to.( {:error, :unknown_method} )
					%FunctionClauseError{ arity: _ } ->
						f_reply_to.( {:error, :unknown_method} )
					nil ->
						f_reply_to.( {:ok, message.payload} )
					_ ->
						f_reply_to.( {:error, message.error} )
				end
			rescue
				_ ->
					Logger.error("Error processing reply. Check :invalid channel.")
					Channel.send(:invalid, message)
			end
		else
			Logger.error("Invalid answer, not registered. Maybe not a reply. Sent to :invalid channel. (#{inspect status}, #{message.id})")
			Channel.send(:invalid, message)
		end
		{:noreply, Map.delete(status, message.id) }
	end
end
