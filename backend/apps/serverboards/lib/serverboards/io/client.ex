import Serverboards.MOM

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
		name: nil,
	]
	alias Serverboards.IO
	alias Serverboards.MOM
	alias Serverboards.MOM.RPC

	@doc ~S"""
	Starts a communication with a client.

	## Options

	* `auth` (true|false) -- Needs authentication. Default true.
	* `name` -- Provides a name for this connection. For debug pourposes.
	"""
	def start_link(options \\ []) do
		{:ok, to_client} = MOM.RPC.Gateway.start_link
		{:ok, to_serverboards} = MOM.RPC.Gateway.start_link

		client = %Serverboards.IO.Client{
			to_client: to_client,
			to_serverboards: to_serverboards,
			name: Keyword.get(options, :name, nil)
		}

		setup_client(client)

		if Keyword.get(options, :auth, true) do
			authenticate(client)
		end

		{:ok, client}
	end

	def tap(client) do
		if client.name do
			Serverboards.MOM.RPC.tap(client.to_serverboards, ">#{client.name}")
			Serverboards.MOM.RPC.tap(client.to_client, "<#{client.name}")
		else
			Serverboards.MOM.RPC.tap(client.to_serverboards)
			Serverboards.MOM.RPC.tap(client.to_client)
		end
	end

	def setup_client(client) do
		tap(client)

		import Serverboards.MOM.RPC.Gateway

		ts = client.to_serverboards
		add_method ts, "version", fn _ ->
			"0.0.1"
		end
		add_method ts, "ping", fn _ ->
			"pong"
		end

		add_method ts, "authenticate", fn params ->
			if params.username == "test" and params.password == "test" do
				#add_router client, "plugins", Plugin.Gateway.RPC.start_link
			end
		end
		:ok
	end

	def authenticate(client) do
		import Serverboards.MOM.RPC.Gateway

		event( client.to_client, "auth.required", ["basic"] )

		#Task.await(client.extra.authenticated)


	end

	def call(client, :to_serverboards, method, params, id, cb) do
		RPC.Gateway.cast(client.to_serverboards, method, params, id, cb)
	end

	def event(client, :to_serverboards, method, params) do
		RPC.Gateway.event(client.to_serverboards, method, params)
	end

	def reply(client, :to_client, result, id) do
		Channel.send(client.to_client.reply, %MOM.Message{
			id: id,
			payload: result
			})
		:ok
	end

	def on_call(client, :to_client, cb) do
		MOM.Channel.subscribe(client.to_client.request, fn msg ->
			cb.(msg.payload.method, msg.payload.params, msg.id)
			:ok
		end)
	end

end
