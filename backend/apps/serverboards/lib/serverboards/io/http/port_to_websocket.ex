require Logger

defmodule Serverboards.IO.HTTP.PortToWebsocket do
  @moduledoc ~S"""
  A simple mapping from uuid to port. It allows to connect from a given UUID to
  a port.

  It has an expiration time of 1 minute

  Clients require an entry here, and later the websocket will do the connection

  Example:

    iex> {:ok, uuid} = add_port(3030, 200)
    iex> {:ok, port} = get_port(uuid)
    iex> port
    3030
    iex> :timer.sleep(500) # let it timeout
    iex> get_port(uuid)
    {:error, :not_found}

  """
  use GenServer

  # 1min
  @timeout 60 * 1000

  def start_link(options \\ []) do
    GenServer.start_link(__MODULE__, :ok, [name: Serverboards.IO.HTTP.PortToWebsocket] ++ options)
  end

  def add_port(port, timeout \\ @timeout) do
    GenServer.call(Serverboards.IO.HTTP.PortToWebsocket, {:add_port, port, timeout})
  end

  def remove_port(uuid) do
    GenServer.call(Serverboards.IO.HTTP.PortToWebsocket, {:remove_port, uuid})
  end

  def get_port(uuid) do
    GenServer.call(Serverboards.IO.HTTP.PortToWebsocket, {:get_port, uuid})
  end

  ## server impl
  def init(:ok) do
    {:ok,
     %{
       uuid_to_port: %{}
     }}
  end

  def handle_call({:add_port, port, timeout}, _from, state) do
    uuid = UUID.uuid4()

    # remove it in @timeout ms
    {:ok, _tref} =
      :timer.apply_after(timeout, Serverboards.IO.HTTP.PortToWebsocket, :remove_port, [uuid])

    {:reply, {:ok, uuid}, %{state | uuid_to_port: Map.put(state.uuid_to_port, uuid, port)}}
  end

  def handle_call({:remove_port, uuid}, _from, state) do
    if uuid != nil do
      Logger.debug("Remove uuid #{uuid}, timeout.")

      {:reply, {:ok, :ok},
       %{
         state
         | uuid_to_port: Map.drop(state.uuid_to_port, [uuid])
       }}
    else
      {:reply, {:error, :not_found}, state}
    end
  end

  def handle_call({:get_port, uuid}, _from, state) do
    port = state.uuid_to_port[uuid]

    if port != nil do
      {:reply, {:ok, port}, state}
    else
      {:reply, {:error, :not_found}, state}
    end
  end
end

defmodule Serverboards.IO.HTTP.PortToWebsocket.Handler do
  @moduledoc ~S"""
  Uses the PortToWebsocket mappings to open a connection on a new
  websocket connection.

  Uses extra messages {:send, data} and {:close} to accept communication from
  the Connection.
  """

  @behaviour :cowboy_websocket_handler
  def init({_tcp, _http}, _req, _opts) do
    {:upgrade, :protocol, :cowboy_websocket}
  end

  defp get_uuid(req) do
    {pathinfo, _} = :cowboy_req.binding(:uuid, req)
    pathinfo
  end

  def websocket_init(_transport_name, req, opts) do
    uuid = get_uuid(req)

    case Serverboards.IO.HTTP.PortToWebsocket.get_port(uuid) do
      {:ok, port} ->
        opts = [:binary, active: true]
        {:ok, socket} = :gen_tcp.connect('localhost', port, opts)
        :gen_tcp.controlling_process(socket, self())

        # Logger.info("websocket protocol: #{inspect :cowboy_req.parse_header("sec-websocket-protocol", req)}")
        req =
          case :cowboy_req.parse_header("sec-websocket-protocol", req) do
            {:undefined, :undefined, _} ->
              req

            {:ok, subprotocols, req} ->
              # Logger.info("Requesting subprotocols: #{inspect subprotocols}")
              if "binary" in subprotocols do
                # Logger.info("Using binary subprotocol")
                :cowboy_req.set_resp_header("sec-websocket-protocol", "binary", req)
              else
                Logger.error(
                  "Requested websocket subprotocol, and dont know how to handle. Ignoring request, quite probably client will just close. #{
                    inspect(subprotocols)
                  }"
                )

                req
              end
          end

        Logger.info("Websocket connected: #{uuid} -> #{port}", uuid: uuid, port: port)
        {:ok, req, socket}

      {:error, :not_found} ->
        Logger.error("Trying to connect to an unknown WS: #{uuid}", uuid: uuid)
        {:shutdown, req}
    end
  end

  def websocket_terminate(_reason, _req, socket) do
    Logger.debug("Websocket disconnected.")
    :gen_tcp.close(socket)
    :ok
  end

  def websocket_handle({:text, line}, req, socket) do
    :gen_tcp.send(socket, line)
    {:ok, req, socket}
  end

  def websocket_handle({:binary, line}, req, socket) do
    :gen_tcp.send(socket, line)
    {:ok, req, socket}
  end

  def websocket_handle(data, req, socket) do
    Logger.debug("Fallback ignore data #{inspect(data)}")
    {:ok, req, socket}
  end

  # we send the :send info that will in turn make it send real data
  def websocket_info({:tcp, _, data}, req, socket) do
    {:reply, {:binary, data}, req, socket}
  end

  def websocket_info({:tcp_closed, _}, req, socket) do
    {:shutdown, req, socket}
  end

  def websocket_info(info, req, socket) do
    Logger.debug("Got info #{inspect(info)}")
    {:noreply, req, socket}
  end
end
