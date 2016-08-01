Mix.Task.run "ecto.create", ["-r", "Serverboards.Repo"]
Mix.Task.run "ecto.migrate", ["-r", "Serverboards.Repo"]
Ecto.Adapters.SQL.Sandbox.mode(Serverboards.Repo, :manual)

Serverboards.Auth.add_auth "freepass", fn params ->
  require Logger
  Logger.debug("Freepass: #{inspect params}")
  "dmoreno@serverboards.io"
end

ExUnit.start()
