defmodule Serverboards.Project.Model.ProjectService do
  use Ecto.Schema
  schema "project_project_service" do
    field :project_id, :id
    field :service_id, :id
    timestamps()
  end
  # @required_fields ~w(project_id service_id)a
  # @optional_fields ~w()a
end
