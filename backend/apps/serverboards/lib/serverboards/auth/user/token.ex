require Logger
require Timex
require Serverboards.Auth.User.Model

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
		now_1s_ago = Timex.shift(DateTime.utc_now, seconds: -1)
		(from t in Model.Token, where: t.token == ^token)
			|> Repo.update_all(
				set: [time_limit: now_1s_ago]
				)
		:ok
	end

	@doc ~S"""
	Set the end time again for a given token.

	This allows to keep using the token for longer time.
	"""
	def refresh(token, email) do
		time_limit = Timex.shift( DateTime.utc_now, days: 1 )
		# {:ok, time_limit} = Ecto.DateTime.cast( time_limit )

		[user_id] = Repo.all( from u in User, where: u.email == ^email, select: u.id )

		(from t in Model.Token, where: t.token == ^token and t.user_id == ^user_id)
			|> Repo.update_all(
				set: [time_limit: time_limit]
				)
		:ok
	end

	def auth(token_uuid) do
		token = Repo.one(
			from u in User,
			join: t in Model.Token,
			  on: t.user_id == u.id,
			where: t.token == ^token_uuid and t.time_limit > ^DateTime.utc_now,
			select: %{ user: u, perms: t.perms }
		)
		case token do
			nil -> false
				Logger.error("Try to use invalid token #{token_uuid}")
				false
			_ ->
				{:ok, user} = Serverboards.Auth.User.user_info token.user
				#Logger.debug("Got token #{token_uuid} for user #{inspect token.user.email}", token: token, user: user)
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
