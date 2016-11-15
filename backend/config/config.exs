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
config :logger, :backends,
  [
    {Serverboards.Logger, :serverboards_logs},
    {Serverboards.Logger.Console, :serverboards_logs_console},
    #:console,
  ]

config :serverboards, Serverboards.HTTP.Endpoint,
  server: (System.get_env("SERVERBOARDS_SERVER") || "true") == "true",
  servername: "localhost",
  http: 8080,
  tcp: 4040,
  root: Path.dirname(__DIR__),
  secret_key_base: "z/AByyR5GKLMJjrMpW/a/pbenQxIYoa3Pa27Ibxs6LLPK1zev45A3zuGShA8aXoH",
  render_errors: [accepts: ~w(html json)]
  #pubsub: [name: Backend.PubSub,
  #         adapter: Phoenix.PubSub.PG2]

config :serverboards, ecto_repos: [Serverboards.Repo]

config :serverboards, Serverboards.Repo,
  [
    adapter: Ecto.Adapters.Postgres,
    url: "ecto://serverboards:serverboards@localhost/serverboards"
  ]

config :eventsourcing, Eventsourcing.Repo,
  [
    adapter: Ecto.Adapters.Postgres,
    pool: Ecto.Adapters.SQL.Sandbox,
    url: "ecto://serverboards:serverboards@localhost/serverboards"
  ]
config :eventsourcing, ecto_repos: []


config :serverboards,
  plugin_paths: [
    "../plugins/",
  ],
  frontend_path: "../frontend/dist",
  debug: false,
  ini_files: [
    "/etc/serverboards.ini",
    "{{SERVERBOARDS_PATH}}/serverboards.ini",
    "{{HOME}}/.local/serverboards/serverboards.ini"
  ]


# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{Mix.env}.exs"
