defmodule Serverboards.Repo.Migrations.Action do
  use Ecto.Migration

  def change do
    create table :action_history do
      add :uuid, :uuid
      add :type, :string
      add :status, :string
      add :params, :map
      add :result, :map
      add :user_id, :id
      add :elapsed, :integer # in ms.
      timestamps
    end

    create index(:action_history, [:uuid])
    create index(:action_history, [:type])
    create index(:action_history, [:status])
    create index(:action_history, [:user_id])
  end
end
