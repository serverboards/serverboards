Mix.Task.run "ecto.create", ["-r", "Serverboards.Repo"]
Mix.Task.run "ecto.migrate", ["-r", "Serverboards.Repo"]
Ecto.Adapters.SQL.begin_test_transaction(Serverboards.Repo)

Serverboards.Auth.add_auth "freepass", fn params ->
  require Logger
  Logger.debug("Freepass: #{inspect params}")
  "dmoreno@coralbits.io"
end

ExUnit.start()
