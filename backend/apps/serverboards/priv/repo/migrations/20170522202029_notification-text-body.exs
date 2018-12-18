defmodule :"Elixir.Serverboards.Repo.Migrations.Notification-text-body" do
  use Ecto.Migration

  def up do
    alter table(:notifications_notification) do
      modify(:body, :text)
    end
  end

  def down do
    alter table(:notifications_notification) do
      modify(:body, :varchar, max_length: 256)
    end
  end
end
