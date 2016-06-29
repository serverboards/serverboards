defmodule Serverboards.Repo.Migrations.Notifications do
  use Ecto.Migration

  def change do
    create table :notifications_channelconfig do
      add :user_id, :id
      add :is_active, :boolean
      add :channel, :string
      add :config, :map
      timestamps
    end

    create index(:notifications_channelconfig, [:user_id])
    create index(:notifications_channelconfig, [:channel])
    create index(:notifications_channelconfig, [:user_id, :is_active])
    create unique_index(:notifications_channelconfig, [:user_id, :channel])
  end
end
