defmodule Serverboards.Repo.Migrations.ServerboardsToProject do
  use Ecto.Migration

  def change do
    rename(table(:serverboard_serverboard), to: table(:project_project))
    rename(table(:serverboard_serverboard_service), to: table(:project_project_service))
    rename(table(:serverboard_serverboard_tag), to: table(:project_project_tag))
    rename(table(:serverboard_widget), to: table(:project_widget))

    rename(table(:project_project_tag), :serverboard_id, to: :project_id)
    rename(table(:project_project_service), :serverboard_id, to: :project_id)
    rename(table(:project_widget), :serverboard_id, to: :project_id)
    rename(table(:rules_rule), :serverboard_id, to: :project_id)
  end
end
