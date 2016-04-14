Mix.Task.run "ecto.create", ["-r", "Serverboards.Repo"]
Mix.Task.run "ecto.migrate", ["-r", "Serverboards.Repo"]
Ecto.Adapters.SQL.begin_test_transaction(Serverboards.Repo)

ExUnit.start()
