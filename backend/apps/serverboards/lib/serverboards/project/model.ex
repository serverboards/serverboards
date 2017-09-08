require Logger
defmodule Serverboards.Project.Model do
  defmodule Project do
    use Ecto.Schema
    schema "project_project" do
      field :shortname, :string
      field :name, :string
      field :description, :string
      field :creator_id, :id
      field :priority, :integer

      has_many :tags, Serverboards.Project.Model.ProjectTag
      timestamps()
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

  defmodule ProjectTag do
    use Ecto.Schema
    schema "project_project_tag" do
      #field :project_id, :id
      field :name, :string

      belongs_to :project, Project
    end
    # @required_fields ~w(project_id name)a
    # @optional_fields ~w()a
  end

  defmodule ProjectService do
    use Ecto.Schema
    schema "project_project_service" do
      field :project_id, :id
      field :service_id, :id
      timestamps()
    end
    # @required_fields ~w(project_id service_id)a
    # @optional_fields ~w()a
  end

  defmodule Dashboard do
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

  defmodule Widget do
    use Ecto.Schema
    schema "project_widget" do
      field :dashboard_id, :id
      field :uuid, Ecto.UUID
      field :widget, :string
      field :config, :map
      field :ui, :map
      timestamps()
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
end
