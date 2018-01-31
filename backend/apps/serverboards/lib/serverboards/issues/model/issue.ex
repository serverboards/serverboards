defmodule Serverboards.Issues.Model.Issue do
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

    timestamps()
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
