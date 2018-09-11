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
	alias MOM.RPC

	def email_auth(%{ "email" => email, "password" => password }) do
		# Logger.debug("Try last resort email auth #{inspect email} / #{inspect password}")
		case Serverboards.Auth.User.Password.auth(email, password) do
			{:error, err} ->
				Logger.error("Error trying to log in by email #{inspect err}")
				false
			false -> false
			user ->
				Logger.debug("Auth OK email")
				user
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
				(try_login_default_plugins(params)
					|> ensure_exists_in_db(type) # requires update db
				) || email_auth(params)
			"token" ->
				token_auth(params)
			other ->
				auth = auth_components()
					|> Enum.find( &(&1.id == other))

				if auth do
					try_login_by_auth(auth, params)
						|> ensure_exists_in_db(type) # requires update db
				else
					Logger.warn("Unknown auth method #{inspect type}", type: type)
					false
				end
		end

		if user do
			Logger.info("Log in user #{user[:name]} <#{user[:email]}>", user: user)
			{:ok,	decorate(user)}
		else
			Logger.error("Login failed, type #{inspect type}", type: type)
			{:error, :unknown_user}
		end
	end

	# Regets the full user, with perms, id and so on
	defp decorate(user) do
		{:ok, ruser} = Serverboards.Auth.User.user_info(user.email)
		%{ ruser |
			groups: Enum.uniq(ruser.groups ++ Map.get(user, :groups, [])),
			perms: Enum.uniq(ruser.perms ++ Map.get(user, :perms, [])),
		}
	end

	defp ensure_exists_in_db(false, _creator), do: false
	defp ensure_exists_in_db(user, creator) do
		Logger.debug("Ensure in db #{inspect user}")
		# check if exists, or create
		nuser = case Serverboards.Auth.User.user_info(user.email) do
			{:error, :unknown_user} ->
				Logger.info("Automatically creating the user #{inspect user.email}", user: user)
				Serverboards.Auth.User.user_add(user, %{ email: creator, perms: ["auth.create_user"]})

				{:ok, existing_user} = Serverboards.Auth.User.user_info(user.email)
				existing_user
			{:ok, existing_user} ->
				# If exists, check it is active, nuser here only for test
				if existing_user.is_active do
					existing_user
				else
					nil
				end
		end

		# update groups
		nuser = if nuser do

			# add extra perms
			nuser = %{ nuser |
				perms: nuser.perms ++ Map.get(user, :perms, [])
			}

			newgroups = MapSet.new user.groups
			oldgroups = MapSet.new nuser.groups
			if not MapSet.equal?(newgroups, oldgroups)  do
				group_list = Serverboards.Auth.Group.group_list(nuser)
				for g <- MapSet.difference(newgroups, oldgroups) do
					if g in group_list do
						Logger.debug("Add #{inspect nuser.email} to group #{inspect g}")
						:ok = Serverboards.Auth.Group.user_add( g, nuser.email, %{ email: creator, perms: ["auth.manage_groups"]})
					end
				end
				for g <- MapSet.difference(oldgroups, newgroups) do
					Logger.debug("Remove #{inspect nuser.email} from group #{inspect g}")
					:ok = Serverboards.Auth.Group.user_remove( g, nuser.email, %{ email: creator, perms: ["auth.manage_groups"]})
				end
			end
			%{ nuser | groups: user.groups }
		end

		Logger.debug("Ready user #{inspect nuser}")

		nuser
	end

	def client_set_user(client, user) do
		#Logger.debug("Setting user: #{inspect user}")
		RPC.Client.set client, :user, user
		MOM.Channel.send(:auth_authenticated, %MOM.Message{ payload: %{ client: client, user: user } }, [sync: true])
	end


	defp try_login_default_plugins(params) do
		#Logger.debug("Try login with params #{inspect params}")
		auth_components()
			|> Enum.filter(&(&1.login.params == "default"))
			|> try_login_by_plugins(params)
	end

	defp try_login_by_plugins([], _params), do: false
	defp try_login_by_plugins([ auth | rest], params) do
		case try_login_by_auth(auth, params) do
			false ->
				try_login_by_plugins(rest, params)
			user ->
				user
		end
	end

	defp try_login_by_auth(%{ command: command, login: %{ call: call }, id: id } = auth, params) when is_binary(command) and is_binary(call) do
		# Logger.debug("Try login at #{inspect id}: #{inspect command}.#{inspect call}(#{inspect params})")
		 case Serverboards.Plugin.Runner.call(command, call, params, "system/auth") do
		  {:ok, email} when is_binary(email) ->
				case Serverboards.Auth.User.user_info(email) do
					{:ok, user}  ->
						Logger.info("Login via #{inspect id} for user #{inspect email}", user: email, auth: auth)
						user
					_ -> false
				end
		 	{:ok, %{} = user} ->
				Logger.info("Login via #{inspect id} for user #{inspect user["email"]}", user: user, auth: auth)
				%{
					email: user["email"],
					name: user["name"],
					perms: Map.get(user, "perms", []),
					groups: Enum.uniq(["user"] ++ Map.get(user, "groups", [])),
					is_active: true
				}
			{:ok, false} ->
				Logger.debug("Could login using #{inspect id}")
				false
			o ->
				Logger.debug("Could login using #{inspect id} because of #{inspect o}")
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
					{:error, :unknown_user} ->
						Logger.error("Requested password reset for unknown user #{email}")
						{:ok, :ok}
					{:ok, me} ->
						Logger.info("Password reset link requested for #{email}")
						token = Serverboards.Auth.User.Token.create(me, ["auth.reset_password"])
						base_url=Serverboards.Settings.get("serverboards.core.settings/base",%{})
							|> Map.get("base_url", "http://localhost:8080")
						link="#{base_url}/#?pr=#{token}"
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
							:ok = Serverboards.Auth.User.Token.invalidate(token)
							Logger.info("Password reset for #{user.email}")
							{:ok, :ok}
						else
							Logger.error("Requested password reset for unknown user #{email}")
							{:ok, :ok}
						end
				end
		end)

		RPC.Client.event( client, "auth.required", list_auth() )
		:ok
	end

	@doc ~S"""
	Returns the list of known authentications

		iex> l = list_auth()
		iex> (Enum.count l) >= 1
		true
		iex> "basic" in l
		true
	"""
	def list_auth do
		auths = (
			["basic", "token"] ++
			(for c <- auth_components() do
				c.id
			end))
		Logger.debug("Found auth types: #{inspect auths}")

		auths
	end

	def auth_components() do
		Serverboards.Plugin.Registry.filter_component(type: "auth")
		 |> Enum.map(fn c ->
			 try do
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
			 catch
				 _, _ ->
				 	Logger.error("Bad formed auth component #{c.id}")
				 	nil
			 end
		 end)
		 |> Enum.filter(&(&1!=nil))
	end


	def auth_and_get_token(authdata) do
		# Logger.debug("Authdata are #{inspect authdata}")
		try do
			with {:ok, user} <- auth(authdata),
					 true <- Enum.any?(user.perms, &(&1 == "auth.token.create")) do
					 	token = Serverboards.Auth.User.Token.create(user)
						{:ok, token}
			else
				_ -> {:error, :not_allowed}
	  	end
		rescue
			any ->
				Logger.error("Could not authenticate with params #{inspect Map.drop(authdata, [:password])}")
				{:error, :invalid_params}
		end
	end
end
