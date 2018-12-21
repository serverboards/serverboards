defmodule Serverboards.Repo.Migrations.Rules do
  use Ecto.Migration

  def change do
    create table(:rules_rule) do
      add(:uuid, :uuid)
      add(:is_active, :boolean)
      add(:name, :string)
      add(:description, :string)
      add(:serverboard_id, :id)

      add(:service_id, :id)
      add(:trigger, :string)
      add(:params, :map)

      timestamps(type: :utc_datetime)
    end

    create(unique_index(:rules_rule, [:uuid]))
    create(index(:rules_rule, [:is_active]))
    create(index(:rules_rule, [:serverboard_id]))

    create table(:rules_action_state) do
      add(:rule_id, :id)
      add(:state, :string)

      add(:action, :string)
      add(:params, :map)
    end

    create(index(:rules_action_state, [:rule_id]))
    create(index(:rules_action_state, [:rule_id, :state]))
  end
end
