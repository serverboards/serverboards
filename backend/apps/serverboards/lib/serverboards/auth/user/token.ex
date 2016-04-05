require Logger
require Timex

defmodule Serverboards.Auth.User.Token do
	use Ecto.Schema
	import Ecto.Changeset
	import Ecto.Query

	alias Serverboards.Auth.User
  alias Serverboards.Repo

	schema "auth_user_token" do
    field :token, :string
    field :time_limit, Ecto.DateTime
    belongs_to :user, User

    timestamps
	end

	@required_fields ~w(user, token)
	@optional_fields ~w()

  @doc ~S"""
  Adds an entry token to the user.
  """
  def create(user) do
    require UUID
    token = UUID.uuid4
    {:ok, tokenv} = Repo.insert(changeset(%User.Token{}, %{
      :user_id => user.id,
      :token => token
      }))
    token
  end

	def auth(token) do
		user = Repo.one(
			from u in User,
			join: t in User.Token,
			  on: t.user_id == u.id,
			where: t.token == ^token and t.time_limit > fragment("NOW()")
		)

		case user do
			nil -> false
			user ->
				User.to_map user
		end
	end

  def changeset(token, params \\ :empty) do
    import Ecto.Changeset
		time_limit = Timex.to_erlang_datetime( Timex.shift( Timex.DateTime.now, days: 1 ) )
		{:ok, time_limit} = Ecto.DateTime.cast( time_limit )

    token
      |> cast(params, [:token, :user_id], [])
      |> put_change(:time_limit, time_limit )
  end
end
