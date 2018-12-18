use Mix.Config

config :elixir,
  ansi_enabled: true

config :serverboards,
  debug: true,
  plugin_paths: [
    "apps/serverboards/test/data/plugins/",
    "../serverboards/test/data/plugins/"
  ],
  logger: false

dburl = "ecto://serverboards:serverboards@localhost/serverboards_test"

config :serverboards, Serverboards.Repo,
  adapter: Ecto.Adapters.Postgres,
  url: dburl,
  pool: Ecto.Adapters.SQL.Sandbox,
  # no logging of SQL
  loggers: []

config :logger, :backends, [
  # {Serverboards.Logger, :serverboards_logs},
  :console
]

# for config_test
config :serverboards,
  test: [
    at: :config_file,
    test: true,
    config_file: true,
    # to check priorities, only at3 should get at test
    at: :econfig,
    at2: :econfig,
    at3: :econfig
  ]

config :serverboards,
  # two possible relative paths
  ini_files: [
    "{{PWD}}/apps/serverboards/test/data/serverboards.ini",
    "{{PWD}}/test/data/serverboards.ini"
  ]
