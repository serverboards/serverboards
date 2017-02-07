use Mix.Config

config :elixir,
  ansi_enabled: true

config :serverboards,
  debug: true,
  plugin_paths: [
    "apps/serverboards/test/data/plugins/",
    "../serverboards/test/data/plugins/",
  ]

dburl="ecto://serverboards:serverboards@localhost/serverboards_test"

config :serverboards, Serverboards.Repo,
  adapter: Ecto.Adapters.Postgres,
  url: dburl,
  pool: Ecto.Adapters.SQL.Sandbox

config :logger, :backends,
  [
    #{Serverboards.Logger, :serverboards_logs},
    :console,
  ]

# for config_test
config :serverboards, test:
  [
   at: :config_file,
   test: true,
   config_file: true,
   at: :econfig, # to check priorities, only at3 should get at test
   at2: :econfig,
   at3: :econfig,
  ]
config :serverboards, ini_files:
  [ # two possible relative paths
    "{{PWD}}/apps/serverboards/test/data/serverboards.ini",
    "{{PWD}}/test/data/serverboards.ini",
  ]
