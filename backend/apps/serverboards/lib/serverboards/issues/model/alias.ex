defmodule Serverboards.Issues.Model.Alias do
  use Ecto.Schema

  schema "issues_aliases" do
    field :issue_id, :id
    field :alias, :string

    has_one :issue, Serverboards.Issues.Model.Issue, references: :issue_id, foreign_key: :id
  end
end
