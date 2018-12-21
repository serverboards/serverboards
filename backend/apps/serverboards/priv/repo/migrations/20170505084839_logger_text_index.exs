defmodule Serverboards.Repo.Migrations.LoggerTextIndex do
  use Ecto.Migration
  @disable_ddl_transaction true

  def up do
    execute(
      "CREATE INDEX CONCURRENTLY logger_line__gin_search ON logger_line USING GIN (to_tsvector('english', message || meta::text));"
    )

    execute("VACUUM ANALYZE logger_line;")
    execute("VACUUM FULL;")
  end

  def down do
    execute("DROP INDEX logger_line__gin_search;")
  end
end
