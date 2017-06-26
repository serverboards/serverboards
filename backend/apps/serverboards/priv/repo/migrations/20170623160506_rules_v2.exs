defmodule :"Elixir.Serverboards.Repo.Migrations.RulesV2" do
  use Ecto.Migration

  def change do
    create table :rules_rule_v2 do
      add :uuid, :uuid
      add :is_active, :boolean
      add :deleted, :boolean

      add :name, :varchar, max_size: 256
      add :description, :text

      add :project_id, :id

      add :rule, :map

      add :from_template, :string

      timestamps()
    end
    create unique_index(:rules_rule_v2, [:uuid])
    create index(:rules_rule_v2, [:is_active])
    create index(:rules_rule_v2, [:deleted])
    create index(:rules_rule_v2, [:project_id])
    create index(:rules_rule_v2, [:uuid, :is_active])

    create table :rules_rule_v2_state do
      add :rule_id, :id
      add :state, :map

      timestamps()
    end
    create unique_index(:rules_rule_v2_state, [:rule_id])
  end
end
