defmodule Serverboards.Repo.Migrations.Settings do
  use Ecto.Migration

  def change do
    create table :settings_settings do
      add :section, :string
      add :data, :map
      timestamps()
    end

    create index(:settings_settings, [:section])
  end
end
