defmodule Serverboards.Repo.Migrations.Settings do
  use Ecto.Migration

  def change do
    create table :settings_settings do
      add :section, :string
      add :data, :map
      timestamps(type: :utc_datetime)
    end

    create index(:settings_settings, [:section])
  end
end
