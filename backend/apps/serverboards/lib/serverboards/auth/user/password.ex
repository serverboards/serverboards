require Logger

defmodule Serverboards.Auth.User.Password do
	alias Serverboards.Auth.User.Model
	alias Serverboards.Repo

	@doc ~S"""
	Authenticates a user by password, and returns the user with the list of
	permissions.
	"""
	def auth(email, password) do
	 user=case Repo.get_by(User, email: email, is_active: true) do
		 {:error, _} -> nil
		 user -> user
	 end
	 if user do
		 if password_check(user, password, user) do
			 %{
				 id: user.id,
				 email: user.email,
				 first_name: user.first_name,
				 last_name: user.last_name,
				 perms: User.get_perms(user)
			 }
		 else
			 {:error, :invalid_user_or_password}
		 end
	 else
		 false
	 end
	end

	@doc ~S"""
	Sets the given password for that user struct.

	# DOES NOT USE EVENTSOURCING.

	this command does not use event sourcing as hat would mean storing the old
	passwords in the store.

	It could store a ":reset_password" command, but just now its stimated its not
	necessary. The password change itself is done at  this very same function.

	# Preconditions

	* Only I can cahnge my password.
	"""
	def password_set(user, password, me) do
		allow_change = (user.id == me.id)

		if allow_change do
			case Repo.get_by(Model.Password, user_id: user.id) do
				nil ->
					cs = Model.Password.changeset(%Model.Password{}, %{
						user_id: user.id,
						password: password
						} )
					case cs do
						%{ errors: [] } ->
							Repo.insert( cs )
							:ok
						_ ->
							Logger.error("Invalid password set for #{user.email}, #{inspect cs.errors}")
							{:error, cs.errors }
					end
				pw ->
					cs = Model.Password.changeset(pw, %{ password: password })
					case cs do
						%{ errors: [] } ->
							Repo.update( cs )
							:ok
						_ ->
							Logger.error("Invalid password set for #{user.email}, #{inspect cs.errors}")
							{:error, cs.errors }
					end
			end
		else
			{:error, :not_allowed}
		end
	end

	@doc ~S"""
	Given an user (with user.id) and a password hash, checks it.

	Returns error on any error, as user has no password, or invalid
	password.

	In case of fail (no valid user, no valid hash), it performs a
	dummy check, just to take some time and processing.
	"""
	def password_check(user, password, _me) do
		import Comeonin.Bcrypt, only: [checkpw: 2, dummy_checkpw: 0]
		case Repo.get_by(Model.Password, user_id: user.id) do
			{:error, _} ->
				dummy_checkpw
			nil ->
				dummy_checkpw
			%Model.Password{} = pw ->
				case pw.password do
					"$bcrypt$" <> hash ->
							checkpw(password, hash)
						_ ->
							dummy_checkpw
				end
		end
	end

	@doc ~S"""
	Prepares a hash for a given password.

	This is a cryptographic hash, as for example bcrypt.
	"""
	def hash_password(password) do
		bcrypt_password(password)
	end

	# modifier to ecrypt passwords properly.
	defp bcrypt_password(password) do
		import Comeonin.Bcrypt, only: [hashpwsalt: 1]

		hash=hashpwsalt(password)

		"$bcrypt$#{hash}"
	end
end
