defmodule Serverboards.Auth.Model do
  defmodule User do
    use Ecto.Schema
    schema "auth_user" do
        field :email, :string
        field :first_name, :string
        field :last_name, :string
        field :is_active, :boolean
        timestamps
     end

     @required_fields ~w(email first_name)
     @optional_fields ~w()

     @doc ~S"""
     Prepares changeset ensuring required data is there, proper
     password lenth, and hashes the password.
     """
     def changeset(user, params \\ :empty) do
       import Ecto.Changeset
       user
         |> cast(params, [:email], [:is_active, :first_name, :last_name])
         |> unique_constraint(:email)
     end
  end


  defmodule GroupPerms do
  	use Ecto.Schema

  	schema "auth_group_perms" do
  		field :group_id, :id
  		field :perm_id, :id
  	end
  end

  defmodule UserGroup do
  	use Ecto.Schema

  	schema "auth_user_group" do
  		field :user_id, :id
  		field :group_id, :id
  	end
  end

  defmodule Group do
  	use Ecto.Schema

  	schema "auth_group" do
  		field :name, :string
  	end

    def changeset(group, params \\ :empty) do
  		import Ecto.Changeset
  		group
  			|> cast(params, [:name], [])
  			|> unique_constraint(:name)
  	end
  end

  defmodule Permission do
  	use Ecto.Schema

  	schema "auth_permission" do
  		field :code, :string
  	end
  end
end
