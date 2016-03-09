defmodule IoTcpTest do
  use ExUnit.Case
  @moduletag :capture_log

  doctest IoTcp

  setup do
    Application.stop(:io_tcp)
    Application.start(:io_tcp)
  end
  setup do
    opts = [:binary, packet: :line, active: false]
    {:ok, socket} = :gen_tcp.connect('localhost', 4040, opts)
    {:ok, socket: socket}
  end

  test "check version", %{socket: socket} do
    :ok = :gen_tcp.send(socket, call_to_json("version", [], 0) <> "\n")
    {:ok, json} = :gen_tcp.recv(socket, 0, 1000)
    response = json_to_result( json )

    assert response == result("0.0.1", 0)
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
