defmodule Serverboards.Auth.Model.Group do
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
