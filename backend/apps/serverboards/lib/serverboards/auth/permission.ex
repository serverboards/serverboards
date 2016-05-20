defmodule Serverboards.Auth.Permission do
	alias Serverboards.Repo
	alias Serverboards.Auth.Model

	@doc ~S"""
	Ensures that the given permission exists,and returns it.

	It might be created if does not exist yet.

		iex> perm = Serverboards.Auth.Permission.ensure_exists("auth.create_user")
		iex> perm.code
		"auth.create_user"

	"""
	def ensure_exists(code) do
		case Repo.get_by(Model.Permission, code: code) do
			nil ->
				{:ok, perm} = Repo.insert( %Model.Permission{code: code})
				perm
			perm -> perm
		end
	end

	def perm_list() do
		import Ecto.Query
		Repo.all(from p in Model.Permission, select: p.code)
	end
end
