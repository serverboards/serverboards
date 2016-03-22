defmodule FakePort do
  def write_msg(port, msg) do
    Logger.info("Write test message #{msg}")
  end
  def read_msg(port) do
    %Serverboards.Router.Message{
      method: "hello",
      payload: [],
    }
  end

  def start_link do
    Agent.start_link(fn -> %{} end)
  end
end

defimpl Serverboards.Router.Port, for: FakePort do
  def write_msg(port, msg), do: FakePort.write_msg(port, msg)
  def read_msg(port), do: FakePort.read_msg(port)
end

defmodule Serverboards.RouterTest do
  use ExUnit.Case
  @moduletag :capture_log

  doctest Serverboards.Router.Basic

  test "Functions are callable" do
    fakeport = FakePort
    peer = Serverboards.Router.Peer.start_link(fakeport)

    fakeport.inject_call("serverboards.ping", [])
    assert fakeport.last_message.response == "pong"

  end
end
