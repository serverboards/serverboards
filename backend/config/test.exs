use Mix.Config

config :serverboards,
  debug: true

config :serverboards, Serverboards.Repo,
  adapter: Ecto.Adapters.Postgres,
  database: "serverboards_test",
  username: "postgres",
  password: "postgres",
  hostname: "localhost",
  port: 5433,
  pool: Ecto.Adapters.SQL.Sandbox
