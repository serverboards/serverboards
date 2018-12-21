defmodule Serverboards.Project.Model.Widget do
  use Ecto.Schema

  schema "dashboard_widget" do
    field(:dashboard_id, :id)
    field(:uuid, Ecto.UUID)
    field(:widget, :string)
    field(:config, :map)
    field(:ui, :map)
    timestamps(type: :utc_datetime)
  end

  @required_fields ~w(dashboard_id uuid widget)a
  @optional_fields ~w(config ui)a
  def changeset(widget, changes \\ :empty) do
    import Ecto.Changeset

    widget
    |> cast(changes, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
  end
end
