defmodule Serverboards.Repo.Migrations.RemoveIssueEventTitle do
  use Ecto.Migration

  def change do
    alter table(:issues_event) do
      remove :title
    end

  end
end
