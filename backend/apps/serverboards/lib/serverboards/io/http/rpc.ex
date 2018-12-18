defmodule Serverboards.IO.HTTP.RPC do
  @moduledoc ~S"""
  Adds access to adding ports to websockets mappings

  This are usefull for redirectling a full protocol over websockets, as for example
  SPICE or VNC.
  """
  alias MOM.RPC

  def start_link(_args \\ [], options \\ []) do
    {:ok, mc} = RPC.MethodCaller.start_link([name: __MODULE__] ++ options)

    # Adds that it needs permissions and user
    Serverboards.Utils.Decorators.permission_method_caller(mc)

    RPC.MethodCaller.add_method(
      mc,
      "http.add_port",
      fn [port] ->
        Serverboards.IO.HTTP.PortToWebsocket.add_port(port)
      end,
      required_perm: "http.port_to_websocket"
    )

    MOM.Channel.subscribe(:auth_authenticated, fn %{payload: %{client: client}} ->
      MOM.RPC.Client.add_method_caller(client, mc)
    end)

    {:ok, mc}
  end
end
