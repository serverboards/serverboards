defmodule :"Elixir.Serverboards.Repo.Migrations.Notification-text-body" do
  use Ecto.Migration

  def change do
    alter table :notifications_notification do
      modify :body, :text
    end
  end
end
