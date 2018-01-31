defmodule Serverboards.Project.Model.ProjectTag do
  use Ecto.Schema
  schema "project_project_tag" do
    #field :project_id, :id
    field :name, :string

    belongs_to :project, Serverboards.Project.Model.Project
  end
  # @required_fields ~w(project_id name)a
  # @optional_fields ~w()a
end
