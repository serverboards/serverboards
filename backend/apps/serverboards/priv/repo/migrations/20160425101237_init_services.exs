defmodule Serverboards.Repo.Migrations.InitComponent do
  use Ecto.Migration

  def change do

    # First components

    create table :service_component do
      add :uuid, :uuid
      add :name, :string
      add :type, :string
      add :creator_id, :id
      add :priority, :integer
      add :config, :map
      timestamps
    end

    create table :service_component_tag do
      add :component_id, :id
      add :name, :string
    end

    create index(:service_component, [:uuid])
    create index(:service_component, [:type])
    create index(:service_component_tag, [:component_id])
    create index(:service_component_tag, [:component_id, :name])

    # Now serverboards

    create table :serverboard_serverboard do
      add :shortname, :string
      add :name, :string
      add :description, :string
      add :creator_id, :id
      add :priority, :integer
      timestamps
    end

    create table :serverboard_serverboard_tag do
      add :serverboard_id, :id
      add :name, :string
    end

    create table :serverboard_serverboard_component do
      add :serverboard_id, :id
      add :component_id, :id
      timestamps
    end

    create unique_index(:serverboard_serverboard, [:shortname])
    create index(:serverboard_serverboard, [:priority])
    create index(:serverboard_serverboard_tag, [:serverboard_id])
    create index(:serverboard_serverboard_component, [:serverboard_id])
    create index(:serverboard_serverboard_component, [:component_id])
  end
end
