defmodule :"Elixir.Serverboards.Repo.Migrations.RulesV2" do
  use Ecto.Migration

  def change do
    create table(:rules_v2_rule) do
      add(:uuid, :uuid)
      add(:is_active, :boolean)
      add(:deleted, :boolean)

      add(:name, :varchar, max_size: 256)
      add(:description, :text)

      add(:project_id, :id)

      add(:rule, :map)

      add(:from_template, :string)

      timestamps(type: :utc_datetime)
    end

    create(unique_index(:rules_v2_rule, [:uuid]))
    create(index(:rules_v2_rule, [:is_active]))
    create(index(:rules_v2_rule, [:deleted]))
    create(index(:rules_v2_rule, [:project_id]))
    create(index(:rules_v2_rule, [:uuid, :is_active]))

    create table(:rules_v2_rule_state) do
      add(:rule_id, :id)
      add(:state, :map)

      timestamps(type: :utc_datetime)
    end

    create(unique_index(:rules_v2_rule_state, [:rule_id]))
  end
end
