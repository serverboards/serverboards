defmodule Serverboards.Repo.Migrations.RuleLastState do
  use Ecto.Migration

  def change do
    alter table(:rules_rule) do
      add(:last_state, :string, size: 256)
    end
  end
end
