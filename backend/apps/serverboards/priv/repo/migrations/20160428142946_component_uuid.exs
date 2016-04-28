defmodule Serverboards.Repo.Migrations.ComponentUuid do
  use Ecto.Migration

  def change do
    alter table(:service_component) do
      add :uuid, :uuid
    end

    create index(:service_component, [:uuid])
  end
end
