use Mix.Config

config :serverboards,
  debug: true,
  plugin_paths: [
    "apps/serverboards/test/data/plugins/",
    "../serverboards/test/data/plugins/",
  ]

config :serverboards, Serverboards.Repo,
  adapter: Ecto.Adapters.Postgres,
  database: "serverboards_test",
  username: "serverboards",
  password: "serverboards",
  hostname: "localhost",
  port: 5433,
  pool: Ecto.Adapters.SQL.Sandbox

config :eventsourcing, Eventsourcing.Repo,
  adapter: Ecto.Adapters.Postgres,
  database: "serverboards_test",
  username: "serverboards",
  password: "serverboards",
  hostname: "localhost",
  port: 5433,
  pool: Ecto.Adapters.SQL.Sandbox
