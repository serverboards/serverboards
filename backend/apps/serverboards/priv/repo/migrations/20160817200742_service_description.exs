defmodule Serverboards.Repo.Migrations.ServiceDescription do
  use Ecto.Migration

  def change do
    alter table(:service_service) do
      add :description, :string, size: 1024
    end
  end
end
