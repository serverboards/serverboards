## Websocket module!
require Logger

defmodule Serverboards.IO.HTTP.WebSocketHandler do
  @behaviour :cowboy_websocket_handler

  alias MOM.RPC

  def init({_tcp, _http}, _req, _opts) do
    {:upgrade, :protocol, :cowboy_websocket}
  end

  def websocket_init(_TransportName, req, _opts) do
    Logger.info("Websocket connected.")

    wspid=self()
    write_line_to_ws = fn line ->
      #Logger.info("Write to WS #{line}")
      send(wspid, {:send_line, line})
    end

    {:ok, client} = RPC.Client.start_link [
        writef: write_line_to_ws,
        name: "WebSocket"
      ]
    Serverboards.Auth.authenticate(client)

    {:ok, req, %{client: client} }
  end
  def websocket_terminate(_reason, _req, _state) do
    Logger.info("Websocket disconnected.")
    :ok
  end

  @doc ~S"""
  Receives a line from WS.
  """
  def websocket_handle({:text, line}, req, state) do
    case RPC.Client.parse_line(state.client, line) do
      {:error, e} ->
        Logger.error("Error parsing websockets data: #{inspect e}. Close connection.")
        Logger.debug("Offending line is #{inspect line}")
        {:shutdown, req, state}
      _ ->
        nil
        {:ok, req, state}
    end
  end

  # ignore other
  def websocket_handle(data, req, state) do
    Logger.debug("Fallback ignore data #{inspect data}")
    {:ok, req, state}
  end

  @doc ~S"""
  Sends a line to the WS.
  """
  def websocket_info({:send_line, line}, req, state) do
    #Logger.info("Call to WS #{line}")
    { :reply, {:text, line}, req, state}
  end

  # fallback message handler
  def websocket_info(info, req, state) do
    Logger.info("Fallback ignore info #{inspect info}")
    {:ok, req, state}
  end
end
