defmodule Serverboards.Issues.Model.Label do
  use Ecto.Schema

  schema "issues_label" do
    field :name, :string
    field :color, :string
  end

  @required_fields ~w(name)a
  @optional_fields ~w(color)a
  def changeset(cc, params \\ :empty) do
    import Ecto.Changeset
    cc
      |> cast(params, @required_fields ++ @optional_fields)
      |> validate_required(@required_fields)
  end
end
