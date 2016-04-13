require Logger

defmodule Serverboards.HTTP.JsonRPC do
  use Serverboards.HTTP.Web, :channel

  def join(any, _payload, socket) do
    Logger.info("Joined to #{inspect any}")
    {:ok, %{}, socket}
  end

  def handle_in("json-rpc", msg, socket) do
    Logger.info("Got message from socket: #{inspect msg}")
  end
end
