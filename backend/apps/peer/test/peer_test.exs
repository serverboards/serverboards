defmodule Serverboards.PeerTest do
  use ExUnit.Case
  doctest Serverboards.Peer

  test "Functions are peers" do
    assert Serverboards.Peer.call(fn [] -> "echo" end, "", []) == "echo"
  end
end
