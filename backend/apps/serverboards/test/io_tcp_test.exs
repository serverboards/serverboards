require Logger

defmodule Serverboards.IoTcpTest do
  use ExUnit.Case
  @moduletag :capture_log

  doctest Serverboards.IO.TCP

  setup do
    Application.stop(:io_tcp)
    Application.start(:io_tcp)
    {:ok, []}
  end
  setup do
    opts = [:binary, packet: :line, active: false]
    {:ok, socket} = :gen_tcp.connect('localhost', 4040, opts)
    {:ok, socket: socket}
  end

  test "check basic comm", %{socket: socket} do
    assert call(socket, "version", []) == "0.0.1"
    assert call(socket, "ping", ["pong"]) == "pong"
    :ok
  end

  test "check two clients simultaneus", %{socket: socket} do
    {:ok, socket_b} = :gen_tcp.connect('localhost', 4040, [:binary, packet: :line, active: false])

    assert call(socket, "version", []) == "0.0.1"
    assert call(socket_b, "ping", ["pong"]) == "pong"
    assert call(socket_b, "version", []) == "0.0.1"
    assert call(socket, "ping", ["pong"]) == "pong"

    :gen_tcp.close(socket_b)
    :ok
  end

  test "Check unknown methods", %{ socket: socket } do
    assert call(socket, "non.existant.method", []) == {:error, "unknown_method"}
  end



  def call(socket, method, params) do
    :ok = :gen_tcp.send(socket, call_to_json(method, params, 0) <> "\n")

    wait_reply(socket, 0)
  end

  def wait_reply(socket, id) do
    {:ok, json} = :gen_tcp.recv(socket, 0, 1000)
    case json_to_result( json ) do
      %{ "result" => result, "id" => ^id } ->
        result
      %{ "error" => error } ->
        {:error, error}
      ans -> # ignore, get result again
        Logger.debug("Got ignored answer: #{inspect ans}")
        wait_reply(socket, id)
    end
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
