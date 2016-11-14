require Logger

defmodule Serverboards.Auth do
	@moduledoc ~S"""
	Manages authentication of users.

	It can use custom auth methods (`add_auth`) in elixir code, or plugins,
	which is any component with the `auth` trait.

	## Example

		iex> auth %{ "type" => "invalid" }
		{:error, :unknown_user}

	Using the fake auth plugin:

		iex> {:ok, ret} = auth %{ "type" => "serverboards.test.auth/auth", "token" => "XXX" }
		iex> ret.email
		"dmoreno@serverboards.io"
		iex> auth %{ "type" => "fake", "token" => "xxx" }
		{:error, :unknown_user}

	"""
	use GenServer

	alias MOM.RPC

	defstruct []

	def email_auth(%{ "email" => email, "password" => password }) do
		case Serverboards.Auth.User.Password.auth(email, password) do
			{:error, _} -> false
			false -> false
			user -> user
				#%{ email: user.email, permissions: user.perms, name: user.name }
		end
	end

	def token_auth(%{ "token" => token }) do
		case Serverboards.Auth.User.Token.auth(token) do
			{:error, _} -> false
			false -> false
			user -> user
				#%{ email: user.email, permissions: user.perms, name: user.name }
		end
	end

	@doc ~S"""
	Check is gien params allow for login.

	Params must contain `type`.

	Returns:
		* false -- no login
		* email -- Uses that email to get all the permissions and data from database

	"""
	def auth(%{ "type" => type } = params) do
		user = case type do
			"basic" ->
				try_login_default_plugins(params) || email_auth(params)
			"token" ->
				token_auth(params)
			other ->
				auth = auth_components
					|> Enum.find( &(&1.id == other))

				if auth do
					try_login_by_auth(auth, params)
				else
					Logger.warn("Unknown auth method #{inspect type}", type: type)
					false
				end
		end
		Logger.debug("Got user: #{inspect user}")

		if user do
			{:ok,
				user
					|> ensure_exists_in_db
					|> decorate
				}
		else
			Logger.error("Login failed, type #{inspect type}", type: type)
			{:error, :unknown_user}
		end
	end

	# Sets the proper permissions from the groups, if proper
	defp decorate(user) do
		if user.perms do
			user
		else
			%{
				user |
				perms: perms_from_groups(user.groups || [])
			}
		end
	end

	# all perms from the given groups
	defp perms_from_groups(groups) do
		import Ecto.Query
		Repo.all(
			from perms in Serverboards.Auth.Model.Permission,
			join: pg in Serverboards.Auth.Model.GroupPerms,
			  on: pg.perm_id == perms.id,
			join: group in Serverboards.Auth.Model.Group,
			  on: pg.group_id == group.id,
			where: group.name in ^groups,
			select: perms.name,
			distinct: true
			)
	end

	defp ensure_exists_in_db(user) do
		user
	end

	def client_set_user(client, user) do
		#Logger.debug("Setting user: #{inspect user}")
		RPC.Client.set client, :user, user
		MOM.Channel.send(:auth_authenticated, %MOM.Message{ payload: %{ client: client, user: user } }, [sync: true])
	end


	defp try_login_default_plugins(params) do
		Logger.debug("Try login with params #{inspect params}")
		auths = auth_components
			|> Enum.filter(&(&1.login.params == "default"))
			|> try_login_by_plugins(params)
	end

	defp try_login_by_plugins([], params), do: false
	defp try_login_by_plugins([ auth | rest], params) do
		case try_login_by_auth(auth, params) do
			false ->
				try_login_by_plugins(rest, params)
			user ->
				user
		end
	end

	defp try_login_by_auth(%{ command: command, login: %{ call: call }, id: id } = auth, params) when is_binary(command) and is_binary(call) do
		Logger.debug("Try login at #{inspect id}: #{inspect command}.#{inspect call}(#{inspect params})")
		 case Serverboards.Plugin.Runner.start_call_stop(command, call, params) do
		  {:ok, username} when is_binary(username) ->
				Logger.info("Login via #{inspect id} for user #{inspect username}", user: username, auth: auth)
				Serverboards.Auth.User.user_info(username)
		 	{:ok, %{} = user} ->
				Logger.info("Login via #{inspect id} for user #{inspect user.username}", user: user, auth: auth)
				%{
					username: user["username"],
					name: user["name"],
					perms: user["perms"],
					groups: user["groups"]
				}
			o ->
				false
		 end
	end


	@doc ~S"""
	Sets up the client for authentication.

	Can call a continuation function f(user) when authentication succeds.
	"""
	def authenticate(client, cont \\ nil) do
		#Logger.debug("Asking for authentication #{inspect client}")

		RPC.Client.add_method(client, "auth.auth", fn
			%{ "type" => _ } = params ->
				case auth(params) do
					{:ok, user} ->
						client_set_user(client, user)
						if cont do
							cont.(user)
						end
						user
					_ ->
						false
				end
		end)
		RPC.Client.add_method(client, "auth.reset_password", fn
			[email] -> # Request token
				Logger.debug("Reset password for #{email}")
				# Check user exists, and is active
				case Serverboards.Auth.User.user_info(email, [require_active: true], %{email: email}) do
					false ->
						Logger.error("Denied password reset link requested for #{email}")
						{:error, :not_allowed}
					me ->
						Logger.info("Password reset link requested for #{email}")
						token = Serverboards.Auth.User.Token.create(me, ["auth.reset_password"])
						link="http://localhost:3000/#?pr=#{token}"
						Serverboards.Notifications.notify(
							email,
							"Password reset link",
							"Please click on the following link to reset your password.\n\n#{link}\n\nThis link is valid for 24 hours.",
							[], me
							)
						{:ok, :ok}
				end
			[email, token, new_password] -> # Reset password
				case Serverboards.Auth.User.Token.auth(token) do
					false -> {:error, :not_allowed}
					user ->
						if "auth.reset_password" in user.perms and user.email==email do
							:ok = Serverboards.Auth.User.Password.password_set(user, new_password, user)
							{1, _} = Serverboards.Auth.User.Token.invalidate(token)
							Logger.info("Password reset for #{user.email}")
							{:ok, :ok}
						else
							{:error, :not_allowed}
						end
				end
		end)

		RPC.Client.event( client, "auth.required", list_auth )
		:ok
	end

	@doc ~S"""
	Returns the list of known authentications

		iex> l = list_auth
		iex> (Enum.count l) >= 1
		true
		iex> "basic" in l
		true
	"""
	def list_auth do
		auths = (
			["basic", "token"] ++
			(for c <- auth_components do
				c.id
			end))
		Logger.debug("Found auth types: #{inspect auths}")

		auths
	end

	def auth_components do
		Serverboards.Plugin.Registry.filter_component(type: "auth")
		 |> Enum.map(fn c ->
			 Logger.debug(inspect c)
			 %{
				 id: c.id,
				 name: c.name,
				 description: c.description,
				 command: c.extra["command"],
				 login: %{
					 call: c.extra["login"]["call"],
					 params: c.extra["login"]["params"]
				 }
			 }
		 end)
	end
end
