require Logger

defmodule Serverboards.WebsocketTest do
  use ExUnit.Case
  @moduletag :capture_log
  @port 8123

  doctest Serverboards.IO.HTTP

  setup_all do
    {:ok, http} =
      case Serverboards.IO.HTTP.start_link(port: @port, name: __MODULE__) do
        {:ok, http} ->
          {:ok, http}

        {:error, {:already_started, pid}} ->
          Logger.debug("Was already started #{inspect(pid)}")
          {:ok, pid}
      end

    on_exit(fn ->
      Serverboards.IO.HTTP.stop(http)
    end)

    # Explicitly get a connection before each test
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(Serverboards.Repo)
    # Setting the shared mode must be done only after checkout
    Ecto.Adapters.SQL.Sandbox.mode(Serverboards.Repo, {:shared, self()})
  end

  @tag timeout: 1_000
  test "Connect to websockets" do
    alias Serverboards.WebsocketTest.Endpoint

    {:ok, data} = HTTPoison.get("http://localhost:#{@port}/")
    Logger.debug("GET / : #{inspect(data)}")
    assert data.status_code == 200 or data.status_code == 404

    {:ok, easyws} = Endpoint.start_link("ws://localhost:#{@port}/ws")
    :timer.sleep(100)
    Logger.debug("Got ws #{inspect(easyws)}")

    {:ok, res} = Endpoint.call(easyws, "dir", [])
    assert Enum.member?(res, "dir")
    assert Enum.member?(res, "auth.auth")
  end
end

### WS helper, to make easy calls and ignore the rest

defmodule Serverboards.WebsocketTest.Endpoint do
  use GenServer

  def start_link(url) do
    GenServer.start_link(__MODULE__, url, [])
  end

  def call(ep, method, params) do
    GenServer.call(ep, {:call, method, params})
  end

  def init(url) do
    {:ok, ws} = Serverboards.WebsocketTest.Endpoint.WS.start_link(url, self())

    {:ok, %{ws: ws, maxid: 0, waiting: %{}}}
  end

  def handle_call({:call, method, params}, from, state) do
    {:ok, message} =
      Poison.encode(%{
        id: state.maxid,
        method: method,
        params: params
      })

    Serverboards.WebsocketTest.Endpoint.WS.send(state.ws, message)

    {:noreply,
     %{state | maxid: state.maxid + 1, waiting: Map.put(state.waiting, state.maxid, from)}}
  end

  def handle_cast({:received, msg}, state) do
    {:ok, msg} = Poison.decode(msg)

    state =
      case msg do
        %{"id" => id, "result" => result} ->
          from = state.waiting[id]
          Logger.debug("Got response for #{inspect(id)} #{inspect(from)}")
          GenServer.reply(from, {:ok, result})
          %{state | waiting: Map.drop(state.waiting, [id])}

        %{"id" => id, "error" => error} ->
          from = state.waiting[id]
          GenServer.reply(from, {:error, error})
          %{state | waiting: Map.drop(state.waiting, [id])}

        other ->
          Logger.info("WS Got message #{inspect(other)}. Ignoring.")
          state
      end

    {:noreply, state}
  end

  defmodule WS do
    use WebSockex

    def start_link(url, parent) do
      WebSockex.start_link(url, __MODULE__, parent)
    end

    def handle_frame({:text, msg}, state) do
      Logger.debug("<<< #{inspect(msg)}")
      GenServer.cast(state, {:received, msg})
      {:ok, state}
    end

    def send(ws, message) do
      Logger.debug(">>> #{inspect(message)}")
      WebSockex.send_frame(ws, {:text, message})
    end
  end
end
