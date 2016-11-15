# ideas from https://github.com/IdahoEv/cowboy-elixir-example
require Logger

defmodule Serverboards.IO.HTTP do
  def start_link(_, [port]) do
    frontend_path = Serverboards.Config.get(:http, :root, "../frontend/dist")
    dispatch = :cowboy_router.compile([
      {:_, # all host names
        [
          {"/", :cowboy_static, {:file, "#{frontend_path}/index.html"} },
          {"/static/:plugin/[...]", Serverboards.IO.HTTP.StaticPlugin, []},
          {"/ws", Serverboards.IO.HTTP.WebSocketHandler, []},
          {"/ws/:uuid", Serverboards.IO.HTTP.PortToWebsocket.Handler, []},
          {"/[...]", :cowboy_static, {:dir, frontend_path}}
        ]
      }
    ])
    {:ok, res} = :cowboy.start_http(
      :http,
      100,
      [{:port, port}],
      [
        {:env, [{:dispatch, dispatch}]},
        # Some fallbacks
        {:onresponse, &postrequest/4}
      ]
    )
    Serverboards.IO.HTTP.PortToWebsocket.start_link
    Serverboards.IO.HTTP.RPC.start_link

    Logger.info("Accepting HTTP connections at http://localhost:#{port}")

    {:ok, res}
  end

  defp postrequest(404, headers, _, req) do
      body = '404 Not found'
      headers=update_header(headers, "content-length", "#{Enum.count body}")
      {:ok, req} = :cowboy_req.reply(404, headers, body, req)
      log_request( req, headers, 404 )
      req
  end

  defp postrequest(500, headers, _, req) do
      body = '500 Internal error'
      headers=update_header(headers, "content-length", "#{Enum.count body}")
      {:ok, req} = :cowboy_req.reply(500, headers, body, req)
      log_request( req, headers, 500 )
      req
  end

  defp postrequest(status, headers, _, req) do
      log_request( req, headers, status )
      req
  end

  def log_request(req, headers, status) do
    {method, _} = :cowboy_req.method req
    {path, _} = :cowboy_req.path req
    #{headers, _} = :cowboy_req.headers req
    content_length = fetch_header headers, "content-length", "-"
    if status in [200,101,302,304] do
      Logger.info("#{method} #{path} #{inspect status} #{content_length}", method: method, path: path, status: status, content_length: content_length)
    else
      Logger.error("#{method} #{path} #{inspect status} #{content_length}", method: method, path: path, status: status, content_length: content_length)
    end
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

  defmodule StaticPlugin do
    @moduledoc ~S"""
    Handler to return static data from plugins.

    It has basic support, but a more comprehensive solution should be found.

    FIXME:
    * It does no authorization check whatsoever so it can be used to list installed
    plugins, and get in some cases some assets.
    * There is no caching
    * Reads the full file and sends it, which is ok for small files.
    * No real "File not found checks"

    It does however check for not asking for resources out of the allowed path.

    Explore use :cowboy_static in some way.
    """
    def init(_type, req, []) do
      {:ok, req, :no_state}
    end

    def handle(request, state) do
      {plugin, _} = :cowboy_req.binding(:plugin,request)
      {rest, _} = :cowboy_req.path_info(request)
      filepath = Enum.join(rest,"/")

      if String.contains?(filepath, "..") do
        raise "Invalid path"
      end

      plugin = Serverboards.Plugin.Registry.find plugin
      requested_filename="#{plugin.path}/static/#{filepath}"

      #Logger.debug("Request static handler: #{requested_filename}")
      {:ok, reply} = case File.read(requested_filename) do
        {:ok, content}  ->
          {mime1, mime2, _} = :cow_mimetypes.web(filepath)
          mimetype="#{mime1}/#{mime2}"

          :cowboy_req.reply(
            200,
            [
              {"content-type", mimetype},
              {"content-length", to_string(byte_size(content))},
              {"access-control-allow-origin", "*"}
            ],
            content,
            request
          )
        {:error, _} ->
          :cowboy_req.reply(
            404,
            [],
            "",
            request
          )
      end

      {:ok, reply, state}
    end

    def terminate(reason, request, state) do
      if reason != {:normal, :shutdown} do
        Logger.error("Not normal static handler termination", request: request, state: state, reason: reason)
      end
      :ok
    end

  end
end
