# This file is responsible for configuring your application
# and its dependencies with the aid of the Mix.Config module.
use Mix.Config

# By default, the umbrella project as well as each child
# application will require this configuration file, ensuring
# they all use the same configuration. While one could
# configure all applications here, we prefer to delegate
# back to each application for organization purposes.
import_config "../apps/*/config/config.exs"

# Configures Elixir's Logger
config :logger, :console,
  format: "$date $time $metadata[$level] $message\n",
  metadata: [:request_id]


config :serverboards,
  plugin_path: "../plugins/"

config :serverboards, Serverboards.HTTP.Endpoint,
  server: true,
  url: [host: "localhost"],
  http: [port: 8080],
  root: Path.dirname(__DIR__),
  secret_key_base: "z/AByyR5GKLMJjrMpW/a/pbenQxIYoa3Pa27Ibxs6LLPK1zev45A3zuGShA8aXoH",
  render_errors: [accepts: ~w(html json)]
  #pubsub: [name: Backend.PubSub,
  #         adapter: Phoenix.PubSub.PG2]

dburl=case System.get_env("SERVERBOARDS_DB") do
  nil -> "ecto://serverboards:serverboards@localhost/serverboards"
  url -> url
end

config :serverboards, Serverboards.Repo,
  [
    adapter: Ecto.Adapters.Postgres,
    url: dburl
  ]

config :eventsourcing, Eventsourcing.Repo,
  [
    adapter: Ecto.Adapters.Postgres,
    pool: Ecto.Adapters.SQL.Sandbox,
    url: dburl
  ]

config :serverboards,
  plugin_paths: [
    "../plugins/",
  ],
  debug: false


# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{Mix.env}.exs"
