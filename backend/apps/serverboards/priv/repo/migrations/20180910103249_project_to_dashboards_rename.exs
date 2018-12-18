defmodule Serverboards.Repo.Migrations.ProjectToDashboardsRename do
  use Ecto.Migration

  def change do
    rename(table("project_widget"), to: table("dashboard_widget"))
    rename(table("project_dashboard"), to: table("dashboard_dashboard"))
  end
end
