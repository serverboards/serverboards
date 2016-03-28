require Logger

defmodule Serverboards.RouterTest do
  use ExUnit.Case
  #@moduletag :capture_log

  doctest Serverboards.Router.Basic

  test "Functions are callable" do
    Logger.debug("Start")
    {:ok, fakeport} = FakePort.start_link
    Logger.debug("Fakeport at #{inspect fakeport}")
    {:ok, peer} = Serverboards.Router.Peer.start_link(fakeport)
    Logger.debug("Peer at #{inspect peer}")

    FakePort.inject_call(fakeport, "hello", [])
    assert FakePort.wait_answer(fakeport) == "world"
  end
end
