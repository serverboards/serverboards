defmodule Serverboards.Project.Model.Dashboard do
  use Ecto.Schema
  schema "project_dashboard" do
    field :uuid, Ecto.UUID
    field :project_id, :id
    field :name, :string
    field :order, :integer, default: 0
    field :config, :map

    timestamps()
  end
  @required_fields ~w(project_id uuid name)a
  @optional_fields ~w(config order)a
  def changeset(widget, changes \\ :empty) do
    import Ecto.Changeset
    widget
      |> cast(changes, @required_fields ++ @optional_fields)
      |> validate_required(@required_fields)
  end
end
