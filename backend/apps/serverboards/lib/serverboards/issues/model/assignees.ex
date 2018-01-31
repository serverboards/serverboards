defmodule Serverboards.Issues.Model.Assignees do
  use Ecto.Schema

  schema "issues_issue_assignee" do
    field :issue_id, :id
    field :user_id, :id

    has_one :issue, Serverboards.Issues.Model.Issue, foreign_key: :creator_id
    has_one :user, Serverboards.Auth.Model.User, foreign_key: :id

    timestamps()
  end
end
