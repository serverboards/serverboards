defmodule Serverboards.Project.Model.Project do
  use Ecto.Schema
  schema "project_project" do
    field :shortname, :string
    field :name, :string
    field :description, :string
    field :creator_id, :id
    field :priority, :integer

    has_many :tags, Serverboards.Project.Model.ProjectTag
    timestamps(type: :utc_datetime)
  end

  @required_fields ~w(shortname)a
  @optional_fields ~w(name description creator_id priority)a
  def changeset(project, changes \\ :empty) do
    import Ecto.Changeset
    project
      |> cast(changes, @required_fields ++ @optional_fields)
      |> validate_required(@required_fields)
  end
end
