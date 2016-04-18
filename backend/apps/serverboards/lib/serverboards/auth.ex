require Logger

defmodule Serverboards.Auth do
	use GenServer

	alias Serverboards.MOM.RPC

	defstruct []

	def start_link(_,_) do
		{:ok, pid} = GenServer.start_link __MODULE__, :ok, name: Serverboards.Auth

		add_auth "basic", fn params ->
			#Logger.debug("Try to log in #{inspect params}")
			%{ "type" => "basic", "email" => email, "password" => password} = params

			case Serverboards.Auth.User.Password.auth(email, password) do
				{:error, _} -> false
				false -> false
				user -> user
					#%{ email: user.email, permissions: user.perms, first_name: user.first_name, last_name: user.last_name }
			end
		end

		add_auth "token", fn params ->
			Logger.debug("Try to log in #{inspect params}")
			%{ "type" => "token", "token" => token} = params

			case Serverboards.Auth.User.Token.auth(token) do
				{:error, _} -> false
				false -> false
				user -> user
					#%{ email: user.email, permissions: user.perms, first_name: user.first_name, last_name: user.last_name }
			end
		end

		Serverboards.MOM.Channel.subscribe(:auth_authenticated, &authenticated(&1))
		#Logger.debug("Auth server ready.")

		{:ok, pid}
	end

	@doc ~S"""
	Sets up the client for authentication.

	Can call a continuation function f(user) when authentication succeds.
	"""
	def authenticate(client, cont \\ nil) do
		#Logger.debug("Asking for authentication #{inspect client}")

		RPC.add_method(client.to_serverboards, "auth.auth", fn
			%{ "type" => _ } = params ->
				user = GenServer.call(Serverboards.Auth, {:auth, params})
				if user do
					#remove_method(method_id)
					#Logger.debug("Logged in!")
					Serverboards.MOM.Channel.send(:auth_authenticated, %Serverboards.MOM.Message{ payload: %{ client: client, user: user } })

					if cont do
						cont.(user)
					end
					user
				else
					#Logger.debug("NOT Logged in.")
					false
				end
		end)

		RPC.event( client.to_client, "auth.required", ["basic"] )
		:ok
	end

	@doc ~S"""
	After being authenticated, set up the client as that user
	"""
	def authenticated(%Serverboards.MOM.Message{ payload: %{ client: client, user: user } }) do
		RPC.add_method client.to_serverboards, "auth.user", fn [] ->
			user
		end

		if Enum.member?(user.perms, "auth.modify_self") do
			RPC.add_method client.to_serverboards, "auth.set_password", fn [password] ->
				Logger.info("#{user.email} changes password.")
				Serverboards.Auth.User.Password.set_password(user, password)
			end
		end

		if Enum.member?(user.perms, "auth.create_token") do
			RPC.add_method client.to_serverboards, "auth.create_token", fn [] ->
				Logger.info("#{user.email} created new token.")
				Serverboards.Auth.User.Token.create(user)
			end
		end

		#if Application.fetch_env!(:serverboards, :debug) and Enum.member?(user.perms, "debug") do
		#	RPC.add_method client.to_serverboards, "debug.observer", fn [] ->
		#		:observer.start
		#	end
		#end

		user
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

		user = if auth_f do
			try do
				auth_f.(params)
			rescue
				e ->
					Logger.error("Error at auth \"#{type}\":\n #{inspect e}\n #{Exception.format_stacktrace System.stacktrace}")
					false
			end
		else
			Logger.error("Unknown auth #{type}")
			false
		end
		#Logger.debug("Auth result #{inspect auth}")


		if user do
			Logger.info("Logged in #{inspect user}")
			{:reply, user, state}
		else
			{:reply, false, state}
		end

	end

	def handle_call({:add_auth, name, f}, _, state) do
		{:reply, :ok,
			%{ state | auths: Map.put(state.auths, name, f) }
		}
	end
end
