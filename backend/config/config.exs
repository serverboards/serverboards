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
config :logger, :backends, [
  {Serverboards.Logger, :serverboards_logs}
  # {Serverboards.Logger.Console, :serverboards_logs_console},
  # :console,
]

config :serverboards, ecto_repos: [Serverboards.Repo]

config :serverboards, Serverboards.Repo,
  adapter: Ecto.Adapters.Postgres,
  url: "ecto://serverboards:serverboards@localhost/serverboards"

config :serverboards,
  plugin_paths: [
    "../plugins/"
  ],
  frontend_path: "../frontend/dist",
  debug: false,
  # From least important to more
  ini_files: [
    "{{HOME}}/.local/serverboards/serverboards.ini",
    "{{SERVERBOARDS_PATH}}/serverboards.ini",
    "/etc/serverboards/*.ini",
    "/etc/serverboards.ini"
  ]

config :eventsourcing, ecto_repos: [Serverboards.Repo]

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{Mix.env()}.exs"
