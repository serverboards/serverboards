defmodule Serverboards.Issues.Model.IssueLabel do
  use Ecto.Schema

  schema "issues_issue_label" do
    field(:issue_id, :id)
    field(:label_id, :id)

    has_one(:issue, Serverboards.Issues.Model.Issue, references: :issue_id, foreign_key: :id)
    has_one(:label, Serverboards.Issues.Model.Label, references: :label_id, foreign_key: :id)
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
