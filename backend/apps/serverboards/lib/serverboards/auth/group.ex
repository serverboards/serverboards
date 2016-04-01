import Ecto.Query

alias Serverboards.Auth.User

defmodule Serverboards.Auth.GroupPerms do
	use Ecto.Schema

	schema "auth_group_perms" do
		field :group_id, :id
		field :perm_id, :id
	end
end

defmodule Serverboards.Auth.UserGroup do
	use Ecto.Schema

	schema "auth_user_group" do
		field :user_id, :id
		field :group_id, :id
	end
end

defmodule Serverboards.Auth.Group do
	use Ecto.Schema

	schema "auth_group" do
		field :name, :string
	end

	def users(group) do
		alias Serverboards.Auth.UserGroup

		from u in User,
			join: ug in UserGroup,
				on: ((u.id == ug.user_id) and (ug.group_id == ^(group.id))),
			select: u
	end

	def add_user(group, user) do
		alias Serverboards.Auth.{UserGroup, Repo}

		Repo.insert( %UserGroup{ user_id: user.id, group_id: group.id })
	end

	def add_perm(group, code) do
		alias Serverboards.Auth.{Permission, GroupPerms, Repo}

		perm = Permission.ensure_exists(code)
		Repo.insert( %GroupPerms{ group_id: group.id, perm_id: perm.id } )
	end
end
