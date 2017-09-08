defmodule Serverboards.Repo.Migrations.LoggerServiceIndex do
  use Ecto.Migration

  def change do
    create index(:logger_line, ["(meta->>'service')"])
    create index(:logger_line, ["(meta->>'service_id')"])
  end
end
