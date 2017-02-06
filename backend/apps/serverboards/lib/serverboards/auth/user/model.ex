defmodule Serverboards.Auth.User.Model do
  defmodule Password do
  	use Ecto.Schema

  	schema "auth_user_password" do
  		field :password, :string
  		belongs_to :user, User

  		timestamps
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
      field :time_limit, Ecto.DateTime
      field :perms, {:array, :string}

      belongs_to :user, User

      timestamps
  	end

  	@required_fields ~w(user_id token)a
  	@optional_fields ~w(perms)a

    def changeset(token, params \\ :empty) do
      import Ecto.Changeset
  		time_limit = Timex.to_erlang_datetime( Timex.shift( Timex.DateTime.now, days: 1 ) )
  		{:ok, time_limit} = Ecto.DateTime.cast( time_limit )

      token
        |> cast(params, @required_fields ++ @optional_fields)
        |> validate_required(@required_fields)
        |> put_change(:time_limit, time_limit )
    end
  end
end
