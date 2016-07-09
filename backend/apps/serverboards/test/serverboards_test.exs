defmodule ServerboardsTest do
  use ExUnit.Case
  @moduletag :capture_log
  
  doctest Serverboards
  doctest Serverboards.Utils, import: true
  doctest Serverboards.Utils.Decorators, import: true

  setup do
    # Explicitly get a connection before each test
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(Serverboards.Repo)
    # Setting the shared mode must be done only after checkout
    Ecto.Adapters.SQL.Sandbox.mode(Serverboards.Repo, {:shared, self()})
  end
end
