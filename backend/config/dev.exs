use Mix.Config

config :serverboards, Serverboards.HTTP.Endpoint,
  debug_errors: true,
  code_reloader: true,
  check_origin: false,
  watchers: [make: ["-C", "../frontend", "watch"]]

config :serverboards, debug: true
