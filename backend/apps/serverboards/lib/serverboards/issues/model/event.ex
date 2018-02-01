defmodule Serverboards.Issues.Model.Event do
  use Ecto.Schema

  schema "issues_event" do
    field :issue_id, :id
    field :creator_id, :id
    field :type, :string
    field :data, :map

    has_one :issue, Serverboards.Issues.Model.Issue, foreign_key: :id
    has_one :creator, Serverboards.Auth.Model.User, references: :creator_id, foreign_key: :id

    timestamps(type: :utc_datetime)
  end
end
