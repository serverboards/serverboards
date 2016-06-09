require Logger
require Timex

defmodule Serverboards.Auth.User.Token do
	import Ecto.Query

	alias Serverboards.Auth.User.Model
	alias Serverboards.Auth.Model.User
  alias Serverboards.Repo

  @doc ~S"""
  Adds an entry token to the user.
  """
  def create(user) do
    require UUID
    token = UUID.uuid4
    {:ok, _tokenv} = Repo.insert(Model.Token.changeset(%Model.Token{}, %{
      :user_id => user.id,
      :token => token
      }))
    token
  end

	def auth(token) do
		user = Repo.one(
			from u in User,
			join: t in Model.Token,
			  on: t.user_id == u.id,
			where: t.token == ^token and t.time_limit > fragment("NOW()")
		)

		case user do
			nil -> false
			user ->
				Serverboards.Auth.User.user_info user
		end
	end
end
