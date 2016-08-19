defmodule Serverboards.Repo.Migrations.RulesTemplates do
  use Ecto.Migration

  def change do
    alter table(:rules_rule) do
      add :from_template, :string, size: 256
    end
  end
end
