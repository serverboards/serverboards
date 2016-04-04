defmodule Serverboards.Auth.User do
	use Ecto.Schema
	import Ecto.Changeset
	import Ecto.Query

	alias Serverboards.Auth.User

	schema "auth_user" do
			field :email, :string
			field :first_name, :string
			field :last_name, :string
			field :is_active, :boolean

			field :perms, {:array, :string}, virtual: true
			has_many :groups, Group

			timestamps
	 end

	 @required_fields ~w(email first_name)
	 @optional_fields ~w()

	 @doc ~S"""
	 Authenticates a user by password, and returns the user with the list of
	 permissions.
	 """
	 def auth(email, password) do
		alias Serverboards.Auth.{Repo}

		user=case Repo.get_by(User, email: email, is_active: true) do
			{:error, _} -> nil
			user -> user
		end
		if user do
			if User.Password.check_password(user, password) do
				%User{user | perms: get_perms(user)}
			else
				{:error, :invalid_user_or_password}
			end
		else
			false
		end
	 end


	 @doc ~S"""
	 Gets all permissions for this user
	 """
	 def get_perms(user) do
		alias Serverboards.Auth.{Permission, GroupPerms, Repo, UserGroup}

		Repo.all(
			from p in Permission,
				join: gp in GroupPerms,
					on: gp.perm_id == p.id,
				join: ug in UserGroup,
					on: ug.group_id == gp.group_id,
			 where: ug.user_id == ^user.id,
			select: p.code
		)
	end

	@doc ~S"""
	Prepares changeset ensuring required data is there, proper
	password lenth, and hashes the password.
	"""
	def changeset(user, params \\ :empty) do
		import Ecto.Changeset
		user
			|> cast(params, [:email], [:is_active, :first_name, :last_name])
			|> unique_constraint(:email)
	end
end
