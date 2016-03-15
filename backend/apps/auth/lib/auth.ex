require Logger

defmodule Serverboards.Auth do
	use Application

	def start(_type, _args) do
		import Supervisor.Spec

		children = [
			supervisor(Serverboards.Auth.Repo, [])
		]
		opts = [strategy: :one_for_one, name: Serverboards.Auth.Supervisor ]
		Supervisor.start_link(children, opts)
	end
end

defmodule Serverboards.Auth.User do
	use Ecto.Schema
	import Ecto.Changeset

	schema "auth_user" do
			field :email, :string
			field :first_name, :string
			field :last_name, :string
			field :is_active, :boolean

			timestamps
	 end

	 @required_fields ~w(email first_name)
	 @optional_fields ~w()
end


defmodule Serverboards.Auth.User.Password do
	use Ecto.Schema
	import Ecto.Changeset
	alias Serverboards.Auth.{User, Repo}
	alias Serverboards.Auth.User.Password

	schema "auth_user_password" do
		field :password, :string
		belongs_to :user, Serverboards.Auth.User

		timestamps
	end

	def set_password(user, password) do
		case Repo.insert(changeset(%User.Password{}, %{
			user_id: user.id,
			password: password
			})) do
				{:error, err}  -> {:error, err.errors}
				other -> other
			end
	end

	@doc ~S"""
	Geiven an user (with user.id) and a password hash, checks it.

	Returns error on any error, as user has no password, or invalid
	password.

	In case of fail (no valid user, no valid hash), it performs a
	dummy check, just to take some time and processing.
	"""
	def check_password(user, password) do
		import Comeonin.Bcrypt, only: [checkpw: 2, dummy_checkpw: 0]
		case Repo.get_by(Password, user_id: user.id) do
			{:error, _} ->

				dummy_checkpw
			pw ->
				case pw.password do
					"$bcrypt$" <> hash ->
							checkpw(password, hash)
						pw ->
							dummy_checkpw
				end
		end
	end

	# modifier to ecrypt passwords properly.
	defp bcrypt_password(password) do
		import Comeonin.Bcrypt, only: [hashpwsalt: 1]
			hash=hashpwsalt(password)
			"$bcrypt$#{hash}"
	end

	@doc ~S"""
	Prepares changeset ensuring required data is there, proper
	password lenth, and hashes the password.
	"""
	def changeset(password, params \\ :empty) do
		import Ecto.Changeset
		#Logger.debug("orig #{inspect password}, new #{inspect params}")
		ret= password
			|> cast(params, [:password, :user_id], ~w())
			|> validate_length(:password, min: 8)
			|> put_change(:password, bcrypt_password(params[:password]))
		#Logger.debug("#{inspect ret}")
		ret
	end
end
