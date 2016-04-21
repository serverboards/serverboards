# ideas from https://github.com/IdahoEv/cowboy-elixir-example
require Logger

defmodule Serverboards.IO.HTTP do
  def start_link(_, [port]) do
    dispatch = :cowboy_router.compile([
      {:_, # all host names
        [
          {"/", :cowboy_static, {:file, "../frontend/dist/index.html"} },
          {"/dd", Serverboards.IO.HTTP.Dynamic, []},
          {"/ws", Serverboards.IO.HTTP.WebSocketHandler, []},
          {"/[...]", :cowboy_static, {:dir, "../frontend/dist"}}
        ]
      }
    ])
    {:ok, _} = :cowboy.start_http(
      :http,
      100,
      [{:port, port}],
      [
        {:env, [{:dispatch, dispatch}]},
        # Some fallbacks
        {:onresponse, &postrequest/4}
      ]
    )
  end

  defp postrequest(404, headers, _, req) do
      body = '404 Not found'
      headers=update_header(headers, "content-length", "#{Enum.count body}")
      {:ok, req} = :cowboy_req.reply(404, headers, body, req)
      log_request( req, headers, 404 )
      req
  end

  defp postrequest(500, headers, _, req) do
      log_request( req, headers, 500 )
      body = '500 Internal error'
      headers=update_header(headers, "content-length", "#{Enum.count body}")
      {:ok, req} = :cowboy_req.reply(500, headers, body, req)
      log_request( req, headers, 404 )
      req
  end

  defp postrequest(status, headers, _, req) do
      log_request( req, headers, status )
      req
  end

  def log_request(req, headers, status) do
    {method, _} = :cowboy_req.method req
    {path, _} = :cowboy_req.path req
    content_length = fetch_header headers, "content-length", "-"
    Logger.info("#{method} #{path} #{inspect status} #{content_length}")
  end

  defp fetch_header([], _, d), do: d
  defp fetch_header([ {tk, tv} | t ], k, d) do
    if tk == k do
      tv
    else
      fetch_header(t, k, d)
    end
  end

  defp update_header([], k, v) do
    [{k,v}] # not existed before, add it
  end
  defp update_header([ {tk, _old_value} | t ], k, v) do
    if (tk==k) do
      [{k,v} | t ]
    else
      update_header(t,k,v)
    end
  end

  ## Websocket module!
  defmodule WebSocketHandler do
    @behaviour :cowboy_websocket_handler

    alias Serverboards.MOM.RPC

    def init({_tcp, _http}, _req, _opts) do
      {:upgrade, :protocol, :cowboy_websocket}
    end

    def websocket_init(_TransportName, req, _opts) do
      Logger.info("Websocket connected!")

      # Here I'm starting a standard erlang timer that will send
      # an empty message [] to this process in one second. If your handler
      # can handle more that one kind of message that wouldn't be empty.
      #:erlang.start_timer(1000, self(), [])
      wspid=self()
      write_line_to_ws = fn line ->
        Logger.info("Write to WS #{line}")
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
      :ok
    end

    @doc ~S"""
    Receives a line from WS.
    """
    def websocket_handle({:text, line}, req, state) do
      RPC.Client.parse_line(state.client, line)
      {:ok, req, state}
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
      Logger.info("Call to WS #{line}")
      { :reply, {:text, line}, req, state}
    end

    # fallback message handler
    def websocket_info(info, req, state) do
      Logger.info("Fallback ignore info #{inspect info}")
      {:ok, req, state}
    end
  end
end
