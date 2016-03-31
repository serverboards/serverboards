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
	]
	alias Serverboards.MOM
	alias Serverboards.MOM.RPC

	@doc ~S"""
	Starts a communication with a client.

	Initialization has two parts, the second part is a call to `ready`.

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
			options: %{
				name: Keyword.get(options, :name),
				auth: Keyword.get(options, :auth, true),
			 },
		}

		{:ok, client}
	end

	def tap(client) do
		if client.options.name do
			Serverboards.MOM.RPC.tap(client.to_serverboards, ">#{client.options.name}")
			Serverboards.MOM.RPC.tap(client.to_client, "<#{client.options.name}")
		else
			Serverboards.MOM.RPC.tap(client.to_serverboards)
			Serverboards.MOM.RPC.tap(client.to_client)
		end
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

		import Serverboards.MOM.RPC.Gateway

		ts = client.to_serverboards
		add_method ts, "version", fn _ ->
			Keyword.get Serverboards.Mixfile.project, :version
		end

		add_method ts, "ping", fn _ ->
			"pong"
		end

		if client.options do
			Serverboards.Auth.authenticate(client)
		end

		:ok
	end

	@doc ~S"""
	Call method from external client to serverboards.

	On reply callback will be called.
	"""
	def call(client, method, params, id, callback) do
		RPC.Gateway.cast(client.to_serverboards, method, params, id, callback)
	end

	@doc ~S"""
	Call event from external client to serverboards
	"""
	def event(client, method, params) do
		RPC.Gateway.event(client.to_serverboards, method, params)
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
			:ok
		end

end
