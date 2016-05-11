import Ecto.Query

alias Serverboards.Auth.User
alias Serverboards.Auth.Model

defmodule Serverboards.Auth.Group do

	def setup_eventsourcing(es) do
		EventSourcing.subscribe es, :add_group, fn %{name: name}, me ->
			Repo.insert(%Model.Group{
					name: name
				})
		end
	end

	def group_add(name, me) do
		EventSourcing.dispatch(:auth, :add_group, %{name: name}, me.email)
	end

	def users(group) do
		from u in User,
			join: ug in Model.UserGroup,
				on: ((u.id == ug.user_id) and (ug.group_id == ^(group.id))),
			select: u
	end

	def add_user(group, user) do
		alias Serverboards.Repo

		case Repo.get_by(Model.UserGroup, user_id: user.id, group_id: group.id) do
			nil ->
				Repo.insert( %Model.UserGroup{ user_id: user.id, group_id: group.id } )
			ug -> ug
		end
	end

	def add_perm(group, code) do
		alias Serverboards.Repo

		perm = Permission.ensure_exists(code)


		case Repo.get_by(Model.GroupPerms, group_id: group.id, perm_id: perm.id) do
			nil ->
				Repo.insert( %Model.GroupPerms{ group_id: group.id, perm_id: perm.id } )
			gp -> gp
		end
	end
end
