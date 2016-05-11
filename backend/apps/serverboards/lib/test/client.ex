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
	def expect(client, what) do
		GenServer.call(RPC.Client.get(client, :pid), {:expect, what})
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

	def handle_call({:expect, what}, from, status) do
		case Enum.drop_while(status.messages, &(!match(what, &1))) do
			[ h | t ] ->
				{:reply, h, %{status | messages: t, expecting: nil }}
			[] ->
				status=%{ status | expecting: %{ what: what, from: from } }
				{:noreply, status}
		end
	end

	def handle_call({:call, msg}, _, status) do
		if status.expecting do
			if match(status.expecting.what, msg) do
				#Logger.debug("Expecting, and got")
				GenServer.reply(status.expecting.from, msg)
				# consumed last, empty list, and no expecting anymore.
				{:reply, :ok, %{
					status | messages: [], expecting: nil
					}}
			else
				#Logger.debug("Expecting #{inspect status.expecting.what}, but not got (got #{inspect msg})")
				{:reply, :ok, %{
					status | messages: status.messages ++ [msg]
					}}
			end
		else
			#Logger.debug("Not expecting, but got")
			{:reply, :ok, %{
				status | messages: status.messages ++ [msg]
				}}
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

	defp match(what, msg) do
		Enum.all? what, fn {k, v} ->
			Map.get(msg, to_string(k), nil) == v
		end
	end
end
