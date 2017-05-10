defmodule Serverboards.Repo.Migrations.RulesDeleted do
  use Ecto.Migration

  def change do
    alter table(:rules_rule) do
      add :deleted, :boolean, default: false
    end
  end
end
