defmodule Serverboards.Project.Model.Dashboard do
  use Ecto.Schema
  schema "dashboard_dashboard" do
    field :uuid, Ecto.UUID
    field :project_id, :id
    field :name, :string
    field :alias, :string  # Internal alias of the table. Will not be shown on UI but can be used to prevent duplicate dashboards by plugins
    field :order, :integer, default: 0
    field :config, :map

    timestamps(type: :utc_datetime)
  end
  @required_fields ~w(project_id uuid name)a
  @optional_fields ~w(config order alias)a
  def changeset(widget, changes \\ :empty) do
    import Ecto.Changeset
    widget
      |> cast(changes, @required_fields ++ @optional_fields)
      |> validate_required(@required_fields)
  end
end
