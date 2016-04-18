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
		state: nil,
    writef: nil,
	]
	alias Serverboards.MOM
	alias Serverboards.MOM.RPC

	@doc ~S"""
	Starts a communication with a client.

  Comunication is using JSON RPC.

  At initialization a funciton to write into the other end must be suplied, and
  new lines are added calling `parse_line`.

  Params:

  * writef is a function that receives a line and writes it to the client.
  * options

	## Options

	* `name` -- Provides a name for this connection. For debug pourposes.

	"""
	def start_link(writef, options \\ []) do
		{:ok, to_client} = MOM.RPC.start_link
		{:ok, to_serverboards} = MOM.RPC.start_link
		{:ok, state} = Agent.start_link(fn -> %{} end)


		client = %Serverboards.MOM.RPC.Client{
			to_client: to_client,
			to_serverboards: to_serverboards,
			options: %{
				name: Keyword.get(options, :name),
			 },
			state: state,
      writef: writef,
		}

    MOM.Channel.subscribe(to_client.request, fn msg ->
      RPC.Client.call_to_remote(client, msg.payload.method, msg.payload.params, msg.id)
      :ok
    end)

    ## Final setup, basic methods
    import Serverboards.MOM.RPC

    #tap(client)
    ts = client.to_serverboards
    add_method ts, "version", fn _ ->
      Keyword.get Serverboards.Mixfile.project, :version
    end

    add_method ts, "ping", fn _ ->
      "pong"
    end


		{:ok, client }
	end

	@doc ~S"""
	Taps all the channels, to ease debug of messages.
	"""
	def tap(client) do
		if client.options.name do
			Serverboards.MOM.RPC.tap(client.to_serverboards, ">#{client.options.name}")
			Serverboards.MOM.RPC.tap(client.to_client, "<#{client.options.name}")
		else
			Serverboards.MOM.RPC.tap(client.to_serverboards)
			Serverboards.MOM.RPC.tap(client.to_client)
		end
		{:reply, :ok, client}
	end

	@doc ~S"""
	Call method from external client to serverboards.

	When reply callback will be called with {:ok, value} or {:error, reason}.
	"""
	def call(client, method, params, id, callback) do
		case RPC.cast(client.to_serverboards, method, params, id, callback) do
			:nok ->
				callback.({ :error, :unknown_method })
			:ok -> :ok
		end
	end

	@doc ~S"""
	Call event from external client to serverboards
	"""
	def event(client, method, params) do
		RPC.event(client.to_serverboards, method, params)
	end

	@doc ~S"""
	Reply to a previous call to client. This is the answer from "on_call".
	"""
	def reply(client, result, id) do
		MOM.Channel.send(client.to_client.reply, %MOM.Message{
			id: id,
			payload: result
			})
	end
	@doc ~S"""
	Reply to a previous call to client with an error. This is the answer from "on_call".
	"""
	def error(client, result, id) do
		MOM.Channel.send(client.to_client.reply, %MOM.Message{
			id: id,
			error: result
			})
	end

	@doc ~S"""
	Sets the user for this client

	User just needs to have email and permissions.
	"""
	def set(client, key, value) do
		Agent.update( client.state, &Map.put(&1, key, value))
	end

	@doc ~S"""
	Gets the user of this client
	"""
	def get(client, key, default \\ nil) do
		#Logger.debug("Get user from #{inspect client}")
		ret = Agent.get(client.state, &Map.get(&1, key, default))
		#Logger.debug("#{inspect ret}")
		ret
	end

  @doc ~S"""
  Parses a line from the client
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
          {:ok, %{ "error" => params, "id" => id}} ->
            RPC.Client.error(client, params, id)
          _ ->
            Logger.debug("Invalid message from client: #{line}")
            raise Protocol.UndefinedError, "Invalid message from client. Closing."
        end
    end
  end

  # Sends a reply to the cmd
  def reply_to_remote(client, id, res) do
    res = case res do
      {:error, error} ->
        Logger.error("Error on method response: #{inspect error}")
        %{ "error" => error, "id" => id}
      {:ok, res} ->
        %{ "result" => res, "id" => id}
    end
    {:ok, res} = JSON.encode( res )
    Logger.debug("Got answer #{res}, writing to #{inspect client}")

    client.writef.("#{res}\n")
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
    client.writef.("#{json}\n")
  end

end
