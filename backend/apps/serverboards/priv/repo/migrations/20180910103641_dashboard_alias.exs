defmodule Serverboards.Repo.Migrations.DashboardAlias do
  use Ecto.Migration

  def change do
    alter table("dashboard_dashboard") do
      add(:alias, :string)
    end
  end
end
