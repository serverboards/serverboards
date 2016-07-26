defmodule Serverboards.Repo.Migrations.NotificationsInapp do
  use Ecto.Migration

  def change do
    create table(:notifications_notification) do
      add :user_id, :id
      add :subject, :string
      add :body, :string
      add :meta, :map
      add :tags, {:array, :string}

      timestamps
    end

    create index(:notifications_notification, [:user_id])
  end
end
