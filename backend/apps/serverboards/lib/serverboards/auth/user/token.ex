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
		(from t in Model.Token, where: t.token == ^token)
			|> Repo.update_all(
				set: [time_limit: Timex.to_erlang_datetime(Timex.DateTime.now)]
				)
	end

	def auth(token_uuid) do
		token = Repo.one(
			from u in User,
			join: t in Model.Token,
			  on: t.user_id == u.id,
			where: t.token == ^token_uuid and t.time_limit > fragment("NOW()"),
			select: %{ user: u, perms: t.perms }
		)
		case token do
			nil -> false
				Logger.error("Try to use invalid token #{token_uuid}")
				nil
			_ ->
				user = Serverboards.Auth.User.user_info token.user
				Logger.debug("Got token #{token_uuid} for user #{inspect token.user.email}", token: token, user: user)
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
