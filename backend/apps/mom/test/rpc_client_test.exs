require Logger
defmodule Serverboards.RPC.ClientTest do
  use ExUnit.Case
  @moduletag :capture_log
  doctest Serverboards.MOM.RPC.Client, import: true

  alias Serverboards.MOM.RPC.Client

  test "Create and stop a client" do
    {:ok, client} = Client.start_link writef: :context

    Client.stop client

    assert (Process.alive? client) == false
  end

  test "Bad protocol" do
    {:ok, client} = Client.start_link writef: :context

    {:error, :bad_protocol} = Client.parse_line client, "bad protocol"
    {:ok, mc} = JSON.encode(%{method: "dir", params: [], id: 1})
    :ok = Client.parse_line client, mc

    Client.stop(client)
  end

  test "Good protocol" do
    {:ok, client} = Client.start_link writef: :context

    {:ok, mc} = JSON.encode(%{method: "dir", params: [], id: 1})
    Client.parse_line client, mc

    :timer.sleep(200)

    {:ok, json} = JSON.decode( Client.get client, :last_line )
    assert Map.get(json,"result") == ~w(dir ping version)

    Client.stop(client)
  end


end
