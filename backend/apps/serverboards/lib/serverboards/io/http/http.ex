# ideas from https://github.com/IdahoEv/cowboy-elixir-example
require Logger

defmodule Serverboards.IO.HTTP do
  def start_link(options) do
    port =
      if options[:port] do
        options[:port]
      else
        Serverboards.Config.get(:http, :port, 8080)
      end

    address =
      if options[:address] do
        options[:address]
      else
        Serverboards.Config.get(:http, :address, "localhost")
      end

    {:ok, {_, _, _, :inet, _, [ip | _more]}} = :inet.gethostbyname(String.to_charlist(address))

    if port do
      start_link(ip, port, options)
    else
      Logger.warn("Not listening HTTP")
      # do not start
      :ignore
    end
  end

  def start_link(ip, port, _options) do
    frontend_path = Serverboards.Config.get(:http, :root, "../frontend/dist")

    if not File.exists?("#{frontend_path}/index.html") do
      Logger.error("Index not at #{frontend_path}/index.html. Check your config.")
    end

    dispatch =
      :cowboy_router.compile([
        # all host names
        {:_,
         [
           {"/", Serverboards.IO.HTTP.Root, [frontend_path]},
           {"/static/:plugin/[...]", Serverboards.IO.HTTP.StaticPlugin, []},
           {"/ws", Serverboards.IO.HTTP.WebSocketHandler, []},
           {"/ws/:uuid", Serverboards.IO.HTTP.PortToWebsocket.Handler, []},
           {"/webhook/:uuid", Serverboards.IO.HTTP.Webhooks.Handler, []},
           {"/[...]", :cowboy_static, {:dir, frontend_path}}
         ]}
      ])

    res =
      :cowboy.start_http(
        :http,
        100,
        [port: port, ip: ip],
        [
          {:env, [{:dispatch, dispatch}]},
          # Some fallbacks
          {:onresponse, &postrequest/4}
        ]
      )

    case res do
      {:ok, _} ->
        Logger.info("Accepting HTTP connections at http://#{:inet.ntoa(ip)}:#{port}")

      {:error, e} ->
        Logger.error(inspect(e))
    end

    res
  end

  def stop(pid, reason \\ :normal) do
    :cowboy.stop_listener(pid)
  end

  defp postrequest(404, headers, body, req) do
    body =
      if body do
        String.to_charlist(body)
      else
        '404 Not found'
      end

    headers = update_header(headers, "content-length", "#{Enum.count(body)}")
    {:ok, req} = :cowboy_req.reply(404, headers, body, req)
    log_request(req, headers, 404)
    req
  end

  defp postrequest(500, headers, _, req) do
    body = '500 Internal error'
    headers = update_header(headers, "content-length", "#{Enum.count(body)}")
    {:ok, req} = :cowboy_req.reply(500, headers, body, req)
    log_request(req, headers, 500)
    req
  end

  defp postrequest(status, headers, _, req) do
    log_request(req, headers, status)
    req
  end

  def log_request(req, headers, status) do
    {method, _} = :cowboy_req.method(req)
    {path, _} = :cowboy_req.path(req)
    # {headers, _} = :cowboy_req.headers req
    content_length = fetch_header(headers, "content-length", "-")

    if status in [200, 101, 302, 304] do
      Logger.info("#{method} #{path} #{inspect(status)} #{content_length}",
        method: method,
        path: path,
        status: status,
        content_length: content_length
      )
    else
      Logger.error("#{method} #{path} #{inspect(status)} #{content_length}",
        method: method,
        path: path,
        status: status,
        content_length: content_length
      )
    end
  end

  defp fetch_header([], _, d), do: d

  defp fetch_header([{tk, tv} | t], k, d) do
    if tk == k do
      tv
    else
      fetch_header(t, k, d)
    end
  end

  defp update_header([], k, v) do
    # not existed before, add it
    [{k, v}]
  end

  defp update_header([{tk, _old_value} | t], k, v) do
    if tk == k do
      [{k, v} | t]
    else
      update_header(t, k, v)
    end
  end
end
