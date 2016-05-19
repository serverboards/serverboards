require Logger

defmodule Test.Client do
	@moduledoc ~S"""
	Fake client to ease test construction.

	Allows to send calls, expect messages/events.

	It creates all the necesary stuff to start as a non connected client
	"""
	use GenServer

	alias Serverboards.MOM.RPC
	alias Test.Client

	@doc ~S"""
	Starts a fake client for tests.

	Options:

	* as: email -- Starts as that email user
	"""
	def start_link(options \\ []) do
		{:ok, pid} = GenServer.start_link __MODULE__, :ok, []
		client=GenServer.call(pid, {:get_client})

		maybe_user=Keyword.get(options, :as, false)
		ok = if maybe_user do
			Serverboards.Auth.authenticate(client)

	    Client.expect( client, method: "auth.required" )
	    user = Serverboards.Auth.User.user_info maybe_user, %{ email: "system", perms: ["auth.info_any_user"] }
			if user do
	    	token = Serverboards.Auth.User.Token.create(user)
				user = Client.call( client, "auth.auth", %{ "type" => "token", "token" => token })
				:ok
			else
				Logger.warn("Test client cant log as user #{inspect maybe_user}")
				:cant_log_in
			end
		else
			:ok
		end

		if ok == :ok do
			{:ok, client}
		else
			GenServer.stop(pid, :normal)
			GenServer.stop(client, :normal)
			{:error, ok}
		end
	end

	def stop(client) do
		GenServer.stop(client)
	end

	def debug(client) do
		GenServer.call(RPC.Client.get(client, :pid), {:debug})
	end

	@doc ~S"""
	Ignore events until this appears or timeout. What is a keyword/value list.

	It is asynchronous and stores all messages since last expect, so that there
	are no race conditions.

	## Example

		iex> cl = Test.Client.start_link
		iex> Test.Client.ready(cl)
		iex> Test.Client.expect(cl, method: "auth.auth")
		%{ method: "auth.auth" }

	"""
	def expect(client, what, timeout \\ 5000) do
		try do
			GenServer.call(RPC.Client.get(client, :pid), {:expect, what}, timeout)
		rescue
			e ->
				false
		end
	end

	@doc ~S"""
	Calls into the client
	"""
	def call(client, method, params) do
		GenServer.call(RPC.Client.get(client, :pid), {:call_serverboards, method, params})
	end

	## server impl
	def init(:ok) do
		pid = self()
		{:ok, client} = RPC.Client.start_link [
			writef: fn line ->
				Logger.debug("Write to test client: #{line}")
				{:ok, rpc_call} = JSON.decode( line )
				GenServer.call(pid, {:call, rpc_call } )
				end,
			name: "TestClient"
			]

		RPC.Client.set client, :pid, pid

		{:ok, %{
				client: client,
				messages: [],
				expecting: nil,
				maxid: 1
		} }
	end

	defp expect_rec(what, []) do
		{false, []}
	end
	defp expect_rec(what, [msg | rest ]) do
		if match?(what, msg) do
			{true, rest}
		else
			{ok, rmsgs} = expect_rec(what, rest)
			{ok, [msg | rmsgs ]}
		end
	end

	def handle_call({:expect, what}, from, status) do
		{isin, messages} = expect_rec(what, status.messages)
		if isin do
			{:reply, true, %{status | messages: messages, expecting: nil }}
		else
			status=%{ status | expecting: %{ what: what, from: from } }
			{:noreply, status, 200}
		end
	end

	def handle_call({:call, msg}, _, status) do
		messages = status.messages ++ [msg]
		messages = if status.expecting do
			{isin, messages} = expect_rec(status.expecting.what, messages)
			if isin do
				GenServer.reply(status.expecting.from, true)
				{:reply, :ok, %{ status | messages: messages, expecting: nil }}
			else
				{:reply, :ok, %{ status | messages: messages }}
			end
		else
			{:reply, :ok, %{ status | messages: messages }}
		end
	end

	def handle_call({:call_serverboards, method, params}, from, status) do
		RPC.Client.call(status.client, method, params, status.maxid, fn res ->
			GenServer.reply(from, res)
		end)
		{:noreply, %{ status | maxid: status.maxid + 1 }}
	end

	def handle_call({:get_client}, _from, status) do
		{:reply, status.client, status}
	end

	def handle_call({:debug}, _from, status) do
		{:reply, %{ "debug test client" => RPC.Client.debug(status.client) }, status}
	end

	defp match(w, nil) do
		false
	end
	defp match([], _) do
		true
	end
	defp match([w | rest], msg) do
		#Logger.debug("Match? #{inspect w} #{inspect msg}")
		cont = case w do
			{:method, v} ->
				Map.get(msg, "method", nil) == v
			{[k], v} ->
				Map.get(msg, to_string(k), nil) == v
			{[k | kr], v} ->
				match([{kr, v}], Map.get( msg, to_string(k)))
			{k, v} ->
				Map.get(msg, to_string(k), nil) == v
		end

		if cont do
			match(rest, msg)
		else
			false
		end
	end

	def handle_info(:timeout, state) do
		GenServer.reply(state.expecting.from, false)
		{:noreply, %{ state | expecting: nil }}
	end
end
