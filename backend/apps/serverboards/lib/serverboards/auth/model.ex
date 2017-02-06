defmodule Serverboards.Auth.Model do
  defmodule User do
    use Ecto.Schema
    schema "auth_user" do
        field :email, :string
        field :name, :string
        field :is_active, :boolean
        timestamps
     end

     @required_fields ~w(email)a
     @optional_fields ~w(name is_active)a

     @doc ~S"""
     Prepares changeset ensuring required data is there, proper
     password lenth, and hashes the password.
     """
     def changeset(user, params \\ :empty) do
       import Ecto.Changeset
       user
         |> cast(params, @required_fields ++ @optional_fields)
         |> validate_required(@required_fields)
         |> unique_constraint(:email)
     end
  end


  defmodule GroupPerms do
    use Ecto.Schema

    schema "auth_group_perms" do
      field :group_id, :id
      field :perm_id, :id
    end

    @fields [:group_id, :perm_id]

    def changeset(obj, params \\ :empty) do
      import Ecto.Changeset
      obj
        |> cast(params, @fields)
        |> validate_required(@fields)
    end
  end

  defmodule UserGroup do
    use Ecto.Schema

    schema "auth_user_group" do
      field :user_id, :id
      field :group_id, :id
    end

    @fields [:group_id, :user_id]

    def changeset(obj, params \\ :empty) do
      import Ecto.Changeset
      obj
        |> cast(params, @fields)
        |> validate_required(@fields)
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
        |> cast(params, [:name])
        |> validate_required([:name])
        |> unique_constraint(:name)
    end
  end

  defmodule Permission do
    use Ecto.Schema

    schema "auth_permission" do
      field :code, :string
    end

    def changeset(obj, params \\ :empty) do
      import Ecto.Changeset
      obj
        |> cast(params, [:code])
        |> validate_required(params, [:code])
    end
  end
end
