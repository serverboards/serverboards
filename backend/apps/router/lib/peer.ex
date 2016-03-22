defmodule Serverboards.Router.Peer do
	@moduledoc ~S"""
	An external peer, TCP, websocket...
	"""
	use GenServer
	alias Serverboards.Router.{Peer, Callable}

	defstruct [
		pid: nil,
		uuid: nil
	]

	@doc ~S"""
	Starts a new peer that will communicate via the given port. The port is
	a Serverboards.Router.Port protocol implementor.
	"""
	def start_link(port) do
		router = Serverboards.Router.Basic.start_link
		uuid = UUID.uuid4

		Logger.debug("New client #{uuid} via #{inspect port}")

		{:ok, pid} = GenServer.start_link(__MODULE__, {router, uuid, port}, [])

		{:ok, %Peer{
			pid: pid,
			uuid: uuid,
			port: port,
		}}
	end

	def init({}) do
		router = Serverboards.Router.Basic.start_link()

		setup_router(router)

		%{
			router: router,
			user: nil,
			perms: []
		}
	end

	def setup_router(router) do
		router.add("login", fn ([email, password], peer) ->
			user = Serverboards.Auth.User.auth_user_password( email, password )
			if user do
				{true, %{ peer | user: user }}
			else
				false
			end
		end)
		router.add("serverboards.user", fn (peer) -> %{
			email: peer.user.email,
			first_name: peer.user.first_name,
			last_name: peer.user.last_name
		} end)
	end

	def call(peer, method, params, _) do
		GenServer.call(peer.pid, {:call, method, params})
	end

	## server implementation
	def handle_call({:call, method, params}, state) do
		res = Callable.call(state.router, method, params)
		{:reply, res, state}
	end

end

defimpl Serverboards.Router.Callable, for: Serverboards.Router.Peer do
	def call(a,b,c) do
			Serverboards.Router.Callable.call(a,b,c)
	end
end
