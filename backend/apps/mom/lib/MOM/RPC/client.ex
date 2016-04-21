require Logger

defmodule Serverboards.MOM.RPC.Client do
	@moduledoc ~S"""
	Each of the IO clients of serverboards.

	It can be TCP/Websocket clients that need to be authenticated, or
	Command clients that are given authentication credentials at creation.

	In any case each Endpoint creates a client, and the client connects to the MOM,
	and do the RPCs.
	"""
	defstruct [
		to_client: nil,
		to_serverboards: nil,
		options: %{},
		writef: nil,
		context: nil
	]
	alias Serverboards.MOM
	alias Serverboards.MOM.RPC

	defmodule BadProtocol do
		defexception [line: nil]

		def message(exception) do
			"Bad protocol at line #{inspect(exception.line)}"
		end
	end


	@doc ~S"""
	Starts a communication with a client.

  Comunication is using JSON RPC.

  At initialization a function to write into the other end must be suplied, and
  new lines are added calling `parse_line`.

	## Options

	* `name` -- Provides a name for this connection. For debug pourposes.
	* `writef`(line)  -- is a function that receives a line and writes it to the client.

	writef is a mandatory option

	"""
	def start_link(options \\ []) do
		writef=Keyword.get(options, :writef)
		if writef do
			GenServer.start_link __MODULE__, options, []
		else
			{:error, :required_writef}
		end
	end

	@doc ~S"""
	Stops cleanly the client and its childs
	"""
	def stop(client) do
		GenServer.stop(client)
	end

	@doc ~S"""
	Taps all the channels, to ease debug of messages.
	"""
	def tap(client) do
		GenServer.call(client, {:tap})
	end

	@doc ~S"""
	Call method from external client to serverboards.

	When reply callback will be called with {:ok, value} or {:error, reason}.
	"""
	def call(client, method, params, id, callback) do
		GenServer.call(client, {:call, method, params, id, callback})
	end

	@doc ~S"""
	Call event from external client to serverboards
	"""
	def event(client, method, params) do
		GenServer.call(client, {:event, method, params})
	end

	@doc ~S"""
	Reply to a previous call to client. This is the answer from "on_call".
	"""
	def reply(client, result, id) do
		GenServer.call(client, {:reply, result, id})
	end
	@doc ~S"""
	Reply to a previous call to client with an error. This is the answer from "on_call".
	"""
	def error(client, result, id) do
		GenServer.call(client, {:error, result, id})
	end

	@doc ~S"""
	Sets the user for this client

	User just needs to have email and permissions.

	## Example

		iex> {:ok, client} = start_link writef: :context
		iex> set client, :user, :me
		iex> get client, :user
		:me
	"""
	def set(client, key, value) do
		GenServer.call(client, {:set, key, value})
	end

	@doc ~S"""
	Gets info from context of this client

	There are special keys, that get info from the client itself:

	* `:to_serverboards`
	* `:to_client`

	## Example

		iex> {:ok, client} = start_link writef: :context
		iex> set client, :user, :me
		iex> get client, :user
		:me
		iex> get client, :other, :default
		:default

		iex> {:ok, client} = start_link writef: :context
		iex> %Serverboards.MOM.RPC{} = get client, :to_serverboards
		iex> %Serverboards.MOM.RPC{} = get client, :to_client
		iex> true # make exdoc happy
		true
	"""
	def get(client, key, default \\ nil) do
		GenServer.call(client, {:get, key, default})
	end

  @doc ~S"""
  Parses a line from the client

	Returns:

	* :ok -- parsed and in processing
	* {:error, :bad_protocol} -- Invalid message, maybe not json, maybe not proper fields.
  """
  def parse_line(client, line) do
    case line do
      '' ->
        :empty
      line ->
        case JSON.decode( line ) do
          {:ok, %{ "method" => method, "params" => params, "id" => id}} ->
            RPC.Client.call(client, method, params, id, &reply_to_remote(client, id, &1))
          {:ok, %{ "method" => method, "params" => params}} ->
            RPC.Client.event(client, method, params)
          {:ok, %{ "result" => result, "id" => id}} ->
            RPC.Client.reply(client, result, id)
          {:ok, %{ "error" => error, "id" => id}} ->
            RPC.Client.error(client, error, id)
          _ ->
						{:error, :bad_protocol}
        end
    end
  end

  # Sends a reply to the cmd
  def reply_to_remote(client, id, res) do
    res = case res do
      {:error, error} ->
        #Logger.error("Error on method response: #{inspect error}")
        %{ "error" => error, "id" => id}
      {:ok, res} ->
        %{ "result" => res, "id" => id}
    end
    {:ok, res} = JSON.encode( res )
    #Logger.debug("Got answer #{res}, writing to #{inspect client}")

		GenServer.call(client, {:write_line, res})
	end

  # calls a method in the client
  def call_to_remote(client, method, params, id) do
    jmsg = %{ method: method, params: params }

    # maybe has id, maybe not.
    jmsg = if id do
      Map.put( jmsg , :id, id )
    else
      jmsg
    end

    # encode and send
    {:ok, json} = JSON.encode( jmsg )
		GenServer.call(client, {:write_line, json})
  end

	## server impl
	def init options do
		{:ok, context} = MOM.RPC.Context.start_link
		{:ok, to_client} = MOM.RPC.start_link context: context, method_caller: false
		{:ok, to_serverboards} = MOM.RPC.start_link context: context

		writef = case Keyword.get(options, :writef) do
			:context -> fn line ->
					Logger.debug("Write to context: :last_line: #{inspect line}")
					MOM.RPC.Context.set context, :last_line, line
				end
			other -> other
		end


		client = %Serverboards.MOM.RPC.Client{
			to_client: to_client,
			to_serverboards: to_serverboards,
			writef: writef,
			context: context
		}

		name = with nil <- Keyword.get(options, :name),
			{:ok, uuid} <- UUID.uuid4,
			do: uuid

		MOM.RPC.Context.set context, :client, client
		MOM.RPC.Context.set context, :name, name

    MOM.Channel.subscribe(to_client.request, fn msg ->
      RPC.Client.call_to_remote(client, msg.payload.method, msg.payload.params, msg.id)
      :ok
    end)

    ts = client.to_serverboards
    RPC.add_method ts, "version", fn _ ->
      Keyword.get Serverboards.Mixfile.project, :version
    end

    RPC.add_method ts, "ping", fn _ ->
      "pong"
    end

		{:ok, client }
	end
	def terminate(reason, client) do
		Logger.error("Terminating client #{RPC.Context.get client.context, :name} because of #{inspect reason}")
		reason
	end


	def handle_call({:tap}, _from, client) do
		name = Client.get client, :name
		Serverboards.MOM.RPC.tap(client.to_serverboards, ">#{name}")
		Serverboards.MOM.RPC.tap(client.to_client, "<#{name}")
		{:reply, :ok, client}
	end
	def handle_call({:call, method, params, id, callback}, _from, client) do
		ret = case RPC.cast(client.to_serverboards, method, params, id, callback) do
			:nok ->
				callback.({ :error, :unknown_method })
			:ok -> :ok
		end
		{:reply, ret, client}
	end
	def handle_call({:event, method, params}, _from, client) do
		{:ok, RPC.event(client.to_serverboards, method, params), client}
	end
	def handle_call({:reply, result, id}, _from, client) do
		ret = MOM.Channel.send(client.to_client.reply, %MOM.Message{
			id: id,
			payload: result
			})
		{:reply, ret, client}
	end
	def handle_call({:error, result, id}, _form, client) do
		ret = MOM.Channel.send(client.to_client.reply, %MOM.Message{
			id: id,
			error: result
			})
		{:reply, ret, client}
	end
	def handle_call({:set, key, value}, _from, client) do
		ret = RPC.Context.set(client.context, key, value)
		{:reply, ret, client}
	end
	def handle_call({:get, :to_client, nil}, _from, client) do
		{:reply, client.to_client, client}
	end
	def handle_call({:get, :to_serverboards, nil}, _from, client) do
		{:reply, client.to_serverboards, client}
	end
	def handle_call({:get, key, default}, _from, client) do
		ret = RPC.Context.get(client.context, key, default)
		{:reply, ret, client}
	end
	def handle_call({:write_line, line}, _from, client) do
    ret = client.writef.(line<>"\n")
		{:reply, ret, client}
  end
end
