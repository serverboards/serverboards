defmodule Serverboards.Repo.Migrations.InitService do
  use Ecto.Migration

  def change do

    # First services

    create table :service_service do
      add :uuid, :uuid
      add :name, :string
      add :type, :string
      add :creator_id, :id
      add :priority, :integer
      add :config, :map
      timestamps()
    end

    create table :service_service_tag do
      add :service_id, :id
      add :name, :string
    end

    create index(:service_service, [:uuid])
    create index(:service_service, [:type])
    create index(:service_service_tag, [:service_id])
    create index(:service_service_tag, [:service_id, :name])

    # Now serverboards

    create table :serverboard_serverboard do
      add :shortname, :string
      add :name, :string
      add :description, :string
      add :creator_id, :id
      add :priority, :integer
      timestamps()
    end

    create table :serverboard_serverboard_tag do
      add :serverboard_id, :id
      add :name, :string
    end

    create table :serverboard_serverboard_service do
      add :serverboard_id, :id
      add :service_id, :id
      timestamps()
    end

    create unique_index(:serverboard_serverboard, [:shortname])
    create index(:serverboard_serverboard, [:priority])
    create index(:serverboard_serverboard_tag, [:serverboard_id])
    create index(:serverboard_serverboard_service, [:serverboard_id])
    create index(:serverboard_serverboard_service, [:service_id])
  end
end
