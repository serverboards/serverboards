Mix.Task.run "ecto.create", ["-r", "Serverboards.Repo"]
Mix.Task.run "ecto.migrate", ["-r", "Serverboards.Repo"]
Ecto.Adapters.SQL.Sandbox.mode(Serverboards.Repo, :manual)

ExUnit.start()
