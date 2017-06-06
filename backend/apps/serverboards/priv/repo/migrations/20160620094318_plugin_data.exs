defmodule Serverboards.Repo.Migrations.PluginData do
  use Ecto.Migration

  def change do
    create table :plugin_data do
      add :plugin, :string
      add :key, :string
      add :value, :map
      timestamps()
    end

    create index(:plugin_data, [:plugin])
    create index(:plugin_data, [:key])
    create unique_index(:plugin_data, [:plugin, :key])
  end
end
