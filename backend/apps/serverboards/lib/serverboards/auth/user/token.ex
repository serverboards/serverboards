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
  def create(user, perms \\ nil) do
    require UUID
    token = UUID.uuid4
		Logger.info("Create token for user #{user.email}", user: user, perms: perms)
    {:ok, _tokenv} = Repo.insert(Model.Token.changeset(%Model.Token{}, %{
      :user_id => user.id,
      :token => token,
			:perms => perms
      }))
    token
  end

	def invalidate(token) do
		Repo.update_all( from t in token, where: t.token == ^token, update: [set: [time_limit: ^Timex.to_erlang_datetime(Timex.DateTime.now)]])
	end

	def auth(token) do
		token = Repo.one(
			from u in User,
			join: t in Model.Token,
			  on: t.user_id == u.id,
			where: t.token == ^token and t.time_limit > fragment("NOW()"),
			select: %{ user: u, perms: t.perms }
		)
		Logger.debug("Got token #{inspect token}")
		user = case token do
			nil -> false
			_ ->
				user = Serverboards.Auth.User.user_info token.user
				case token.perms do
					nil ->
						user
					[] ->
						user
					perms ->
						Logger.debug("Set custom perms: #{inspect perms}")
						%{ user | perms: perms }
				end
		end
	end
end
