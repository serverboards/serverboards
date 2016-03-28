require Logger

defmodule Serverboards.Router.Peer do
	@moduledoc ~S"""
	An external peer, TCP, websocket...
	"""
	use GenServer
	alias Serverboards.Router.{Peer, Callable, Port}
	alias Serverboards.Router

	defstruct [
		pid: nil,
		uuid: nil,
		port: nil
	]

	@doc ~S"""
	Starts a new peer that will communicate via the given port. The port is
	a Serverboards.Router.Port protocol implementor.
	"""
	def start_link(port) do
		{:ok, router} = Serverboards.Router.Basic.start_link
		uuid = UUID.uuid4

		Logger.debug("New client #{uuid} via #{inspect port}")

		{:ok, pid} = GenServer.start_link(__MODULE__, {router, uuid, port}, [])

		peer = %Peer{
			pid: pid,
			uuid: uuid,
			port: port,
		}

		# async doa loop reading messages, processing them
		Task.start_link(fn -> Serverboards.Router.Peer.read_msg_loop(peer) end)

		{:ok, peer}
	end

	def call(peer, method, params) do
		GenServer.call(peer.pid, {:call, method, params})
	end

	def read_msg_loop(peer) do
		msg = Port.read_msg(peer.port)

		Logger.debug("Peer #{inspect peer}. Got message #{inspect msg}")

		ans = %{ id: msg.id }
		ans = case Callable.call(peer, msg.method, msg.payload) do
			{:error, e} -> Map.put(ans, :error, e)
			answer ->  Map.put(ans, answer: answer)
		end

		Logger.debug("Peer. Answer #{inspect ans}")

		Port.write_msg(peer.port, ans)

		read_msg_loop(peer)
	end

	## server implementation
	def init({router, uuid, port}) do
		setup_router(router)

		{:ok, %{
			router: router,
			user: nil,
			uuid: uuid,
			port: port,
			perms: []
		}}
	end

	def setup_router(router) do
		Router.add(router, "login", fn ([email, password], peer) ->
			user = Serverboards.Auth.User.auth_user_password( email, password )
			if user do
				{true, %{ peer | user: user }}
			else
				false
			end
		end)
		Router.add(router, "serverboards.user", fn (peer) -> %{
			email: peer.user.email,
			first_name: peer.user.first_name,
			last_name: peer.user.last_name
		} end)

		m=Serverboards.Router.Basic.to_map(router)
		Logger.debug("Router ready: #{inspect m}")

		router
	end

	def handle_call({:call, method, params}, from, state) do
		res = case Router.lookup(state.router, method) do
			{:error, e} -> {:error, e}
			{callable, method } -> Callable.call(callable, method, params)
		end
		{:reply, res, state}
	end

end

defimpl Serverboards.Router.Callable, for: Serverboards.Router.Peer do
	def call(a,b,c) do
			Serverboards.Router.Peer.call(a,b,c)
	end
end
