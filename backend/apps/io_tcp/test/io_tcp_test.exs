defmodule Serverboards.IoTcpTest do
  use ExUnit.Case
  @moduletag :capture_log

  doctest Serverboards.IoTcp

  setup do
    Application.stop(:io_tcp)
    Application.start(:io_tcp)
  end
  setup do
    opts = [:binary, packet: :line, active: false]
    {:ok, socket} = :gen_tcp.connect('localhost', 4040, opts)
    {:ok, socket: socket}
  end

  test "check basic comm", %{socket: socket} do
    assert call(socket, "version", []) == "0.0.1"
    assert call(socket, "ping", ["pong"]) == "pong"
  end

  def call(socket, method, params) do
    :ok = :gen_tcp.send(socket, call_to_json(method, params, 0) <> "\n")
    {:ok, json} = :gen_tcp.recv(socket, 0, 1000)
    %{ "result" => result } = json_to_result( json )
    result
  end

  def call_to_json(method, params, id) do
    {:ok, json}  = JSON.encode(%{method: method, params: params, id: id})
    json
  end

  def result(result, id) do
    %{"result" => result, "id" => id}
  end

  def json_to_result(json) do
    {:ok, json}  = JSON.decode(json)
    json
  end
end
