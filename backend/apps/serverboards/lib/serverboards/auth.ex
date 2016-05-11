require Logger

defmodule Serverboards.Auth do
	@moduledoc ~S"""
	Manages authentication of users.

	It can use custom auth methods (`add_auth`) in elixir code, or plugins,
	which is any component with the `auth` trait.

	## Example

		iex> auth %{ "type" => "invalid" }
		false

	Create new auths:

		iex> add_auth "letmein", fn %{ "email" => email } -> email end
		iex> auth %{ "type" => "letmein", "email" => "dmoreno@serverboards.io" }
		"dmoreno@serverboards.io"

	Using the fake auth plugin:

		iex> auth %{ "type" => "fake", "token" => "XXX" }
		{:ok, "dmoreno@serverboards.io"}
		iex> auth %{ "type" => "fake", "token" => "xxx" }
		{:ok, false}

	"""
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
	Check is gien params allow for login.

	Params must contain `type`.

	Returns:
		* false -- no login
		* email -- Uses that email to get all the permissions and data from database

	"""
	def auth(%{ "type" => _ } = params) do
		GenServer.call(Serverboards.Auth, {:auth, params})
	end

	@doc ~S"""
	Sets up the client for authentication.

	Can call a continuation function f(user) when authentication succeds.
	"""
	def authenticate(client, cont \\ nil) do
		#Logger.debug("Asking for authentication #{inspect client}")

		RPC.add_method((RPC.Client.get client, :to_serverboards), "auth.auth", fn
			%{ "type" => _ } = params ->
				user = auth(params)
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

		RPC.Client.event_to_client( client, "auth.required", ["basic"] )
		:ok
	end

	@doc ~S"""
	After being authenticated, set up the client as that user
	"""
	def authenticated(%Serverboards.MOM.Message{ payload: %{ client: client, user: user } }) do
		RPC.Client.set client, :user, user
		to_serverboards = RPC.Client.get client, :to_serverboards
		RPC.add_method to_serverboards, "auth.user", fn [] ->
			user
		end

		if Enum.member?(user.perms, "auth.modify_self") do
			RPC.add_method to_serverboards, "auth.set_password", fn [password] ->
				Logger.info("#{user.email} changes password.")
				Serverboards.Auth.User.Password.set_password(user, password)
			end
		end

		if Enum.member?(user.perms, "auth.create_token") do
			RPC.add_method to_serverboards, "auth.create_token", fn [] ->
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
		{:ok, es } = EventSourcing.start_link name: :auth

		EventSourcing.Model.subscribe es, :service, Serverboards.Repo
    EventSourcing.subscribe es, :debug_full

		Serverboards.Auth.User.setup_eventsourcing(es)

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
			case Serverboards.Plugin.Registry.filter_component trait: "auth", id: type do
				[] ->
					Logger.error("Unknown auth #{type}")
					false
				[component] ->
					case Serverboards.Plugin.Runner.start component do
						{:ok, cmd} ->
							res = case Serverboards.Plugin.Runner.call cmd, "auth", params do
								{:error, _} ->
									false
								res ->
									res
							end
							Serverboards.Plugin.Runner.stop cmd
							res
						_ ->
							false
					end
			end
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
