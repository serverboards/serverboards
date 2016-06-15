use Mix.Config

config :serverboards,
  debug: true,
  plugin_paths: [
    "apps/serverboards/test/data/plugins/",
    "../serverboards/test/data/plugins/",
  ]

dburl=case System.get_env("SERVERBOARDS_DBTEST") do
  nil -> "ecto://serverboards:serverboards@localhost/serverboards_test"
  url -> url
end

config :serverboards, Serverboards.Repo,
  adapter: Ecto.Adapters.Postgres,
  url: dburl,
  pool: Ecto.Adapters.SQL.Sandbox

config :eventsourcing, Eventsourcing.Repo,
  adapter: Ecto.Adapters.Postgres,
  url: dburl,
  port: 5433,
  pool: Ecto.Adapters.SQL.Sandbox
