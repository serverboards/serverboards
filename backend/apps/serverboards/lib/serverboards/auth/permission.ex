defmodule Serverboards.Auth.Permission do
	use Ecto.Schema
	alias Serverboards.Repo

	schema "auth_permission" do
		field :code, :string
	end


	@doc ~S"""
	Ensures that the given permission exists,and returns it.

	It might be created if does not exist yet.

		iex> perm = Serverboards.Auth.Permission.ensure_exists("auth.create_user")
		iex> perm.code
		"auth.create_user"

	"""
	def ensure_exists(code) do
		case Repo.get_by(Serverboards.Auth.Permission, code: code) do
			nil ->
				{:ok, perm} = Repo.insert( %Serverboards.Auth.Permission{code: code})
				perm
			perm -> perm
		end
	end
end
