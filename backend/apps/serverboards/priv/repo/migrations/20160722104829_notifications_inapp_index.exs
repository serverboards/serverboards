defmodule Serverboards.Repo.Migrations.NotificationsInappIndex do
  use Ecto.Migration

  def up do
    execute(
      "CREATE INDEX notifications_notification_tags_index ON notifications_notification USING GIN(tags);"
    )
  end

  def down do
    execute("DROP INDEX notifications_notification_tags_index;")
  end
end
