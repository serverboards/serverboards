require Logger

defmodule Serverboards.Auth.User.Model do
  defmodule Password do
  	use Ecto.Schema

  	schema "auth_user_password" do
  		field :password, :string
  		belongs_to :user, Serverboards.Auth.Model.User

  		timestamps(type: :utc_datetime)
  	end

    @required_fields [:password, :user_id]
    @doc ~S"""
  	Prepares changeset ensuring required data is there, proper
  	password lenth, and hashes the password.
  	"""
  	def changeset(password, params \\ :empty) do
  		import Ecto.Changeset
  		#Logger.debug("orig #{inspect password}, new #{inspect params}")
  		ret = password
  			|> cast(params, @required_fields)
        |> validate_required(@required_fields)
  			|> validate_length(:password, min: 8)
  			|> put_change(:password,
            Serverboards.Auth.User.Password.hash_password(params[:password]))
  		ret
  	end
  end

  defmodule Token do
    use Ecto.Schema
    schema "auth_user_token" do
      field :token, :string
      field :time_limit, :utc_datetime
      field :perms, {:array, :string}

      belongs_to :user, Serverboards.Auth.Model.User

      timestamps(type: :utc_datetime)
  	end

  	@required_fields ~w(user_id token)a
  	@optional_fields ~w(perms)a

    def changeset(token, params \\ :empty) do
      import Ecto.Changeset
      ttl = case Serverboards.Config.get("global", "token_ttl", 1) do
        nr when is_binary(nr) ->
          case Integer.parse(nr) do
            {nr, ""} -> nr
            other ->
              Logger.error("Could not parse auth/token_ttl config. Using 1day ttl.")
              1
          end
        nr when is_number(nr) ->
          nr
      end

  		time_limit = Timex.shift( DateTime.utc_now(), days: ttl)

      token
        |> cast(params, @required_fields ++ @optional_fields)
        |> validate_required(@required_fields)
        |> put_change(:time_limit, time_limit )
    end
  end
end
