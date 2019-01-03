require Logger

defmodule Serverboards.IoTcpTest do
  use ExUnit.Case
  @moduletag :capture_log

  doctest Serverboards.IO.TCP

  setup do
    Application.stop(:io_tcp)
    Application.start(:io_tcp)

    {:ok, listener} =
      Task.start(fn ->
        Serverboards.IO.TCP.start_accept({127, 0, 0, 1}, 4040)
      end)

    on_exit(fn ->
      Process.exit(listener, :normal)
    end)

    # Explicitly get a connection before each test
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(Serverboards.Repo)
    # Setting the shared mode must be done only after checkout
    Ecto.Adapters.SQL.Sandbox.mode(Serverboards.Repo, {:shared, self()})

    opts = [:binary, packet: :line, active: false]
    {:ok, socket} = :gen_tcp.connect('localhost', 4040, opts)
    {:ok, listener: listener, socket: socket}
  end

  test "check basic comm", %{socket: socket} do
    assert call(socket, "version", []) == Mix.Project.config()[:version]
    assert call(socket, "ping", ["pong"]) == "pong"
    :ok
  end

  test "check two clients simultaneus", %{socket: socket} do
    {:ok, socket_b} = :gen_tcp.connect('localhost', 4040, [:binary, packet: :line, active: false])

    assert call(socket, "version", []) == Mix.Project.config()[:version]
    assert call(socket_b, "ping", ["pong"]) == "pong"
    assert call(socket_b, "version", []) == Mix.Project.config()[:version]
    assert call(socket, "ping", ["pong"]) == "pong"

    :gen_tcp.close(socket_b)
    :ok
  end

  test "Check unknown methods", %{socket: socket} do
    assert call(socket, "non.existant.method", []) == {:error, "unknown_method"}
  end

  def call(socket, method, params) do
    :ok = :gen_tcp.send(socket, call_to_json(method, params, 0) <> "\n")

    wait_reply(socket, 0)
  end

  def wait_reply(socket, id) do
    {:ok, json} = :gen_tcp.recv(socket, 0, 1000)

    case json_to_result(json) do
      %{"result" => result, "id" => ^id} ->
        result

      %{"error" => error} ->
        {:error, error}

      # ignore, get result again
      ans ->
        Logger.debug("Got ignored answer: #{inspect(ans)}")
        wait_reply(socket, id)
    end
  end

  def call_to_json(method, params, id) do
    {:ok, json} = Poison.encode(%{method: method, params: params, id: id})
    json
  end

  def result(result, id) do
    %{"result" => result, "id" => id}
  end

  def json_to_result(json) do
    {:ok, json} = Poison.decode(json)
    json
  end
end
