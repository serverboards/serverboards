require Logger

defmodule Serverboards.Auth do
	use GenServer

	import Serverboards.MOM.RPC
	defstruct []

	def start_link(_,_) do
		{:ok, pid} = GenServer.start_link __MODULE__, :ok, name: Serverboards.Auth

		add_auth "basic", fn params ->
			#Logger.debug("Try to log in #{inspect params}")
			%{ "type" => "basic", "email" => email, "password" => password} = params

			case Serverboards.Auth.User.auth(email, password) do
				{:error, _} -> false
				user ->
					%{ email: user.email, permissions: user.perms, first_name: user.first_name, last_name: user.last_name }
			end
		end

		add_auth "token", fn params ->
			#Logger.debug("Try to log in #{inspect params}")
			%{ "type" => "token", "token" => token} = params

			if token == "XXX" do
				%{ email: "xxx@test.es", permissions: ["view_user"] }
			else
				false
			end
		end
		#Logger.debug("Auth server ready.")

		{:ok, pid}
	end

	@doc ~S"""
	Sets up the client for authentication and returns future to be fulfilled when
	the user authenticates, with the authenticated user.
	"""
	def authenticate(client) do
		import Serverboards.MOM.RPC.Gateway

		authenticated_promise = Promise.new
		method_id = add_method client.to_serverboards, "auth.auth", fn params ->
			user = GenServer.call(Serverboards.Auth, {:auth, params})
			if user do
				#remove_method(method_id)
				#Logger.debug("Logged in!")
				authenticated(client, user)

				Promise.set(authenticated_promise, user)
				user
			else
				#Logger.debug("NOT Logged in.")
				false
			end
		end

		event( client.to_client, "auth.required", ["basic"] )

		authenticated_promise
	end

	@doc ~S"""
	After being authenticated, set up the client as that user
	"""
	defp authenticated(client, user) do
		import Serverboards.MOM.RPC.Gateway

		add_method client.to_serverboards, "auth.set_password", fn [password] ->
			Serverboards.Auth.User.Password.set_password(user, password)
		end
		add_method client.to_serverboards, "auth.user", fn params ->
			user
		end
	end

	def add_auth(type, f) do
		GenServer.call(Serverboards.Auth, {:add_auth, type, f})
	end

	## server impl
	def init(:ok) do
		{:ok, %{
			auths: %{}
		} }
	end


	def handle_call({:auth, params}, _, state) do
		type = Map.get(params, "type")
		auth_f = Map.get(state.auths, type)

		auth = if auth_f do
			try do
				auth_f.(params)
			rescue
				_ ->
					Logger.error("Error at auth \"#{type}\":\n #{Exception.format_stacktrace System.stacktrace}")
					false
			end
		else
			Logger.error("Unknown auth #{type}")
			false
		end
		#Logger.debug("Auth result #{inspect auth}")

		if auth do
			Logger.info("Logged in #{auth.email}")
		end

		{:reply, auth, state}
	end

	def handle_call({:add_auth, name, f}, _, state) do
		{:reply, :ok,
			%{ state | auths: Map.put(state.auths, name, f) }
		}
	end
end
