require Logger

defmodule EventTest do
  use ExUnit.Case, async: false
  @moduletag :capture_log

  alias Test.Client
  alias Serverboards.IO.HTTP.PortToWebsocket

  doctest Serverboards.IO.HTTP.PortToWebsocket, import: true

  setup do
    # Explicitly get a connection before each test
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(Serverboards.Repo)
    # Setting the shared mode must be done only after checkout
    Ecto.Adapters.SQL.Sandbox.mode(Serverboards.Repo, {:shared, self()})
  end

  test "Use RPC to create port" do
    {:ok, client} = Client.start_link as: "dmoreno@serverboards.io"

    {:ok, uuid} = Client.call(client, "http.add_port", [8080])

    assert PortToWebsocket.get_port(uuid) == {:ok, 8080}
  end

  # Missing is a test that really uses websockets
end
