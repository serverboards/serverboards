defmodule Serverboards.Auth.User.Model do
  defmodule Password do
  	use Ecto.Schema

  	schema "auth_user_password" do
  		field :password, :string
  		belongs_to :user, User

  		timestamps
  	end
    @doc ~S"""
  	Prepares changeset ensuring required data is there, proper
  	password lenth, and hashes the password.
  	"""
  	def changeset(password, params \\ :empty) do
  		import Ecto.Changeset
  		#Logger.debug("orig #{inspect password}, new #{inspect params}")
  		ret = password
  			|> cast(params, [:password, :user_id], ~w())
  			|> validate_length(:password, min: 8)
  			|> put_change(:password,
            Serverboards.Auth.User.Password.hash_password(params[:password]))
  		ret
  	end
  end
end
