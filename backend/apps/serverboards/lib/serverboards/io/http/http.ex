# ideas from https://github.com/IdahoEv/cowboy-elixir-example
require Logger

defmodule Serverboards.IO.HTTP do
  def start_link(options) do
    port = Serverboards.Config.get(:http, :port, 8080)
    if port do
      start_link(port, options)
    else
      Logger.warn("Not listening HTTP")
      :ignore # do not start
    end
  end

  def start_link(port, _options) do
    frontend_path = Serverboards.Config.get(:http, :root, "../frontend/dist")
    if not File.exists?("#{frontend_path}/index.html") do
      Logger.error("Index not at #{frontend_path}/index.html. Check your config.")
    end
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
      [port: port, ip: {127,0,0,1}],
      [
        {:env, [{:dispatch, dispatch}]},
        # Some fallbacks
        {:onresponse, &postrequest/4}
      ]
    )
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
end
