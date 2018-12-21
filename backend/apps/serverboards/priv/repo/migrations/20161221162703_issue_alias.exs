defmodule Serverboards.Repo.Migrations.IssueAlias do
  use Ecto.Migration

  def change do
    create table(:issues_aliases) do
      add(:issue_id, :id)
      add(:alias, :string, size: 256)
    end

    create(index(:issues_aliases, [:alias]))
    create(index(:issues_aliases, [:issue_id]))
  end
end
