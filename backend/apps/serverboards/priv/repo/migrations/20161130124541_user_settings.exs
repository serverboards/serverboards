defmodule Serverboards.Repo.Migrations.UserSettings do
  use Ecto.Migration

  def change do
    create table :settings_user_settings do
      add :section, :text
      add :user_id, :integer
      add :data, :map

      timestamps
    end
    create index(:settings_user_settings, [:section])
    create index(:settings_user_settings, [:user_id])
    create index(:settings_user_settings, [:section, :user_id])
  end
end
