defmodule Serverboards.Issues.Model do
  defmodule Issue do
    use Ecto.Schema

    schema "issues_issue" do
      field :creator_id, :id
      field :title, :string
      field :status, :string

      has_one :creator, Serverboards.Auth.Model.User, references: :creator_id, foreign_key: :id

      has_many :issue_labels, Serverboards.Issues.Model.IssueLabel
      has_many :labels, through: [:issue_labels, :label]
      has_many :events, Serverboards.Issues.Model.Event
      has_many :issue_assignees, Serverboards.Issues.Model.Assignees
      has_many :assignees, through: [:issue_assignees, :assignee]
      has_many :aliases, Serverboards.Issues.Model.Alias

      timestamps
    end

    @required_fields ~w(title status)a
    @optional_fields ~w(creator_id)a
    def changeset(cc, params \\ :empty) do
      import Ecto.Changeset
      cc
        |> cast(params, @required_fields ++ @optional_fields)
        |> validate_required(@required_fields)
    end
  end

  defmodule Alias do
    use Ecto.Schema

    schema "issues_aliases" do
      field :issue_id, :id
      field :alias, :string

      has_one :issue, Serverboards.Issues.Models.Issue, references: :issue_id, foreign_key: :id
    end
  end

  defmodule Label do
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
  defmodule IssueLabel do
    use Ecto.Schema

    schema "issues_issue_label" do
      field :issue_id, :id
      field :label_id, :id

      has_one :issue, Serverboards.Issues.Model.Issue, references: :issue_id, foreign_key: :id
      has_one :label, Serverboards.Issues.Model.Label, references: :label_id, foreign_key: :id
    end
    @required_fields ~w(issue_id label_id)a
    @optional_fields ~w()a
    def changeset(cc, params \\ :empty) do
      import Ecto.Changeset
      cc
        |> cast(params, @required_fields ++ @optional_fields)
        |> validate_required(@required_fields)
    end
  end
  defmodule Event do
    use Ecto.Schema

    schema "issues_event" do
      field :issue_id, :id
      field :creator_id, :id
      field :type, :string
      field :data, :map

      has_one :issue, Serverboards.Issues.Model.Issue
      has_one :creator, Serverboards.Auth.Model.User, references: :creator_id, foreign_key: :id

      timestamps
    end
  end
  defmodule Assignees do
    use Ecto.Schema

    schema "issues_issue_assignee" do
      field :issue_id, :id
      field :user_id, :id

      has_one :issue, Serverboards.Issues.Model.Issue
      has_one :user, Serverboards.Auth.Model.User

      timestamps
    end
  end

end
