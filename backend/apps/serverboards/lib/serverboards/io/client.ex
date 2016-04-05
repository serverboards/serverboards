require Logger

defmodule Serverboards.IO.Client do
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
	]
	alias Serverboards.MOM
	alias Serverboards.MOM.RPC
	alias Serverboards.IO.Client

	@doc ~S"""
	Starts a communication with a client.

	Initialization has two parts, the second part is a call to `ready`.

	## Options

	* `user` (%Auth.User{}|false) -- Already is authenticated as that user, or not authenticated
	* `name` -- Provides a name for this connection. For debug pourposes.
	"""
	def start_link(options \\ []) do
		{:ok, to_client} = MOM.RPC.start_link
		{:ok, to_serverboards} = MOM.RPC.start_link
		{:ok, state} = Agent.start_link(fn -> %{} end)

		client = %Serverboards.IO.Client{
			to_client: to_client,
			to_serverboards: to_serverboards,
			options: %{
				name: Keyword.get(options, :name),
			 },
			state: state,
		}

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
	Mark that client is ready and should start working.

	This is a two step initialization (start_link / ready) to be able to
	add necesary callbacks and connections before any message is processed.
	"""
	def ready(client) do
		require Logger
		#Logger.debug("#{inspect client}")
		tap(client)

		import Serverboards.MOM.RPC

		ts = client.to_serverboards
		add_method ts, "version", fn _ ->
			Keyword.get Serverboards.Mixfile.project, :version
		end

		add_method ts, "ping", fn _ ->
			"pong"
		end

		if not get_user client do
			Serverboards.Auth.authenticate(client)
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
				callback.({ :error, "unknown_method" })
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
	Set callback to call at client. From serverboards.
	"""
	def on_call(client, cb) do
		MOM.Channel.subscribe(client.to_client.request, fn msg ->
			cb.(msg.payload.method, msg.payload.params, msg.id)
			:ok
		end)
	end

	@doc ~S"""
	Reply to a previous call to client. This is the answer from "on_call".
	"""
	def reply(client, result, id) do
		Channel.send(client.to_client.reply, %MOM.Message{
			id: id,
			payload: result
			})
	end

	@doc ~S"""
	Sets the user for this client
	"""
	def set_user(client, %Serverboards.Auth.User{} = user) do
		Agent.update( client.state, &Map.put(&1, :user, user))
	end

	@doc ~S"""
	Gets the user of this client
	"""
	def get_user(client) do
		#Logger.debug("Get user from #{inspect client}")
		ret = Agent.get(client.state, &Map.get(&1, :user, false))
		#Logger.debug("#{inspect ret}")
		ret
	end

end
