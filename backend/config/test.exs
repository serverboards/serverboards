use Mix.Config

config :serverboards,
  debug: true,
  plugin_path: "../plugins/"

config :serverboards, Serverboards.Repo,
  adapter: Ecto.Adapters.Postgres,
  database: "serverboards_test",
  username: "postgres",
  password: "postgres",
  hostname: "localhost",
  port: 5433
