defmodule Serverboards.Repo.Migrations.InitComponent do
  use Ecto.Migration

  def change do

    # First components

    create table :service_component do
      add :name, :string
      add :type, :string
      add :creator, :id
      add :priority, :integer
      timestamps
    end

    create table :service_component_tag do
      add :component_id, :id
      add :name, :string
    end

    create table :service_component_config do
      add :component_id, :id
      add :key, :string
      add :value, :string
    end

    create index(:service_component, [:type])
    create index(:service_component_tag, [:component_id])
    create index(:service_component_tag, [:component_id, :name])
    create index(:service_component_config, [:component_id])
    create index(:service_component_config, [:component_id, :key])

    # Now services

    create table :service_service do
      add :shortname, :string
      add :name, :string
      add :description, :string
      add :creator, :id
      add :priority, :integer
      timestamps
    end

    create table :service_service_tag do
      add :service_id, :id
      add :name, :string
    end

    create table :service_service_component do
      add :service_id, :id
      add :component_id, :id
      timestamps
    end

    create unique_index(:service_service, [:shortname])
    create index(:service_service, [:priority])
    create index(:service_service_tag, [:service_id])
    create index(:service_service_component, [:service_id])
    create index(:service_service_component, [:component_id])
  end
end
