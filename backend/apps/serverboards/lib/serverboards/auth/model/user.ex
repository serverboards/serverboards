defmodule Serverboards.Auth.Model.User do
  use Ecto.Schema

  schema "auth_user" do
    field(:email, :string)
    field(:name, :string)
    field(:is_active, :boolean)
    timestamps(type: :utc_datetime)
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
