require Logger

defmodule MOM.RPC do
	@moduledoc ~S"""
	Gateway adapter for RPC.

	Creates a command and a response channel, which has to be connected to a RPC
	processor.

	It also has Method Caller lists to call directly and can be chained

	Options:

	 * `context` -- Use the given context, if none, creates one
	 * `method_caller: [mc|nil|false]` -- Use the given method caller, if nil create one, false dont use.

	`method_caller: false` is needed when connecting with an endpoint that provides all
	method calling, for example a remote side.

	## Example of use

	It can be used in a blocking fasion

		iex> alias MOM.{Message, Channel, RPC}
		iex> {:ok, rpc} = RPC.start_link
		iex> Channel.subscribe(rpc.request, fn msg ->
		...>	Channel.send(msg.reply_to, %Message{ payload: msg.payload.params, id: msg.id })
		...> 	:ok
		...> 	end, front: true) # dirty echo rpc.
		iex> RPC.call(rpc, "echo", "Hello world!", 1)
		{:ok, "Hello world!"}

	Or non blocking

		iex> alias MOM.{Message, Channel, RPC}
		iex> require Logger
		iex> {:ok, rpc} = RPC.start_link
		iex> Channel.subscribe(rpc.request, fn msg -> Channel.send(msg.reply_to, %Message{ payload: msg.payload.params, id: msg.id }) end) # dirty echo rpc.
		iex> RPC.cast(rpc, "echo", "Hello world!", 1, fn answer -> Logger.info("Got the answer: #{answer}") end)
		:ok

	Returns `{:error, :unkown_method}` when method does not exist

		iex> alias MOM.RPC
		iex> {:ok, rpc} = RPC.start_link
		iex> RPC.call(rpc, "echo", "Hello world!", 1)
		{:error, :unknown_method}

	dir is a method caller functionality, so no method caller, no dir.

		iex> alias MOM.RPC
		iex> {:ok, rpc} = RPC.start_link method_caller: false
		iex> RPC.call(rpc, "dir", [], 1)
		{:error, :unknown_method}

	"""
	alias MOM.{RPC, Tap}

	use GenServer
	defstruct [
		request: nil, # gets inside the MOM,
		reply: nil, # gets out of the MOM.
		uuid: nil,
		pid: nil,
		reply_id: nil, # subscription for reply, to unsubscribe
		method_caller: nil,
		context: nil
	]

	alias MOM.{Channel, Message, RPC}

	def start_link(options \\ []) do
		{:ok, pid} = GenServer.start_link(__MODULE__, :ok, [])

		{:ok, request} = Channel.PointToPoint.start_link
		{:ok, reply} = Channel.PointToPoint.start_link
		method_caller = case Keyword.get options, :method_caller, nil do
			nil ->
				{:ok, method_caller} = RPC.MethodCaller.start_link
				method_caller
			mc -> mc
		end

		# Create new context, or reuse given one.
		context = case Keyword.get(options, :context, nil) do
			nil ->
				{:ok, context} = RPC.Context.start_link
				context
			context ->
				context
		end

		reply_id = Channel.subscribe(reply, &GenServer.cast( pid, {:reply, &1} ) )

		rpc = %RPC{
			request: request,
			reply: reply,
			uuid: UUID.uuid4(),
			pid: pid,
			reply_id: reply_id,
			method_caller: method_caller,
			context: context
		}

		# When new request, do the calls and return on the reply channel
		if method_caller do
			Channel.subscribe(request, fn msg ->
				RPC.MethodCaller.cast(
														method_caller, msg.payload.method,
														msg.payload.params, msg.payload.context,
					fn
					{:ok, v} ->
						reply = %Message{
										payload: v,
										id: msg.id
						}
						Channel.send(msg.reply_to, reply)
						:ok
					{:error, :unknown_method} ->
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
		end

		{:ok, rpc}
	end

	def debug(rpc) do
		%{
			method_caller: RPC.MethodCaller.debug(rpc.method_caller),
			uuid: rpc.uuid
		}
	end

	@doc ~S"""
	Stops the server
	"""
	def stop(rpc) do
		GenServer.stop(rpc.pid)
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
				context: rpc.context
				}
			} } )
		#Logger.debug("Result #{inspect ok}")
		case ok do
			:ok -> nil
			ret -> ret
		end
	end

	@doc ~S"""
	Performs an RPC call, but dont wait for processing.

	Callback will be called when the call is processed, with the answer.

	It always returns :ok, and on callback it will call {:ok, v} or {:error, e}

	## Example

		iex> alias MOM.RPC
		iex> {:ok, rpc} = RPC.start_link
		iex> RPC.add_method rpc, "test", fn [] -> :ok end
		iex> RPC.cast(rpc, "test", [], 0, fn {:ok,:ok} -> :ok end)
		:ok

	If cast to a non existent method, will call cast with {:error, :unknown_method}

		iex> alias MOM.RPC
		iex> {:ok, rpc} = RPC.start_link
		iex> RPC.cast(rpc, "test", [], 0, fn {:error, :unknown_method} -> :ok end)
		:ok

	"""
	def cast(rpc, method, params, id, cb) when is_function(cb) do
		#Logger.debug("RPC cast start #{method}")
		GenServer.cast( rpc.pid, { :cast, rpc.request, %Message{
			reply_to: if id do rpc.reply else nil end,
			id: id,
			payload: %RPC.Message{
				method: method,
				params: params,
				context: rpc.context
				}
			}, cb } )
	end

	@doc ~S"""
	Sends an event to the RPC channels.

	An event is a method without id, and no answer.

	Always returns :ok. If nobody consumed it, it will appear at :invalid messages,
	if no receptor, at :deadletter

	## Example

		iex> alias MOM.RPC
		iex> {:ok, rpc} = RPC.start_link
		iex> RPC.event(rpc, "test", [])
		:ok

	"""
	def event(rpc, method, params) do
		cast(rpc, method, params, nil, fn _ -> :ok end)
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

		iex> import MOM.RPC
		iex> {:ok, rpc} = start_link
		iex> add_method rpc, "echo", &(&1)
		iex> call(rpc, "echo", "Hello", 1)
		{:ok, "Hello"}

	Sync mode

		iex> import MOM.RPC
		iex> {:ok, rpc} = start_link
		iex> add_method rpc, "echo", &(&1), async: false
		iex> call(rpc, "echo", "Hello", 2)
		{:ok, "Hello"}
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

	def handle_cast({:cast, channel, message, cb}, status) do
		status = case Channel.send(channel, message) do
			:ok ->
				if message.id do
					Map.put(status, message.id, cb )
				else
					status
				end
			:nok ->
				if message.id do
					Logger.debug("Invalid method #{inspect message.payload.method}")
				else
					Logger.debug("Invalid event #{inspect message.payload.method}")
				end
				#Channel.send(:invalid, message)
				cb.({:error, :unknown_method})
				status
			:empty ->
				Logger.debug("Empty channel")
				cb.({:error, :unknown_method})
				status
				#Channel.send(:deadletter, message)
		end
		#Logger.debug("Cast result: #{inspect ret}")
		{:noreply, status}
	end

	def handle_cast({:reply, message}, status) do
		#Logger.debug("Got reply: #{inspect message}")
		f_reply_to = Map.get(status, message.id)
		if f_reply_to do
			params = case message.error do
				:unknown_method ->
					{:error, :unknown_method}
				%FunctionClauseError{ arity: _ } ->
					{:error, :unknown_method}
				nil ->
					{:ok, message.payload}
				_ ->
					{:error, message.error}
			end
			try do
				f_reply_to.( params )
			rescue
				e ->
					Logger.error("Error processing reply. Check :invalid channel.\n#{inspect e}\n#{Exception.format_stacktrace}")
					Channel.send(:invalid, message)
			end
		else
			Logger.error("Invalid answer id, not registered. Maybe not a reply. Sent to :invalid channel. (#{inspect status}, #{message.id})")
			Channel.send(:invalid, message)
		end
		{:noreply, Map.delete(status, message.id) }
	end
end
