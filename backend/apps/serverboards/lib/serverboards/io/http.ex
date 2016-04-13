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
      body = "500 Internal error"
      headers=update_header(headers, "content-length", Enum.count body)
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
  defp fetch_header([ {tk, tv} | t ], k, d \\ nil) do
    if tk == k do
      tv
    else
      fetch_header(t, k, d)
    end
  end

  defp update_header([], k, v) do
    [{k,v}] # not existed before, add it
  end
  defp update_header([ {tk, tv} | t ], k, v) do
    if (tk==k) do
      [{k,v} | t ]
    else
      update_header(t,k,v)
    end
  end

  ## Websocket module!
  defmodule WebSocketHandler do
    @behaviour :cowboy_websocket_handler

    def init({tcp, http}, _req, _opts) do
      {:upgrade, :protocol, :cowboy_websocket}
    end

    def websocket_init(_TransportName, req, _opts) do
      Logger.info("Websocket connected!")

      # Here I'm starting a standard erlang timer that will send
      # an empty message [] to this process in one second. If your handler
      # can handle more that one kind of message that wouldn't be empty.
      :erlang.start_timer(1000, self(), [])
      {:ok, req, :undefined_state }
    end
    def websocket_terminate(_reason, _req, _state) do
      :ok
    end
    def websocket_handle(c, req, state) do
      Logger.log("#{c}")
      {:text, content}=c
      # Use JSEX to decode the JSON message and extract the word entered
      # by the user into the variable 'message'.
      { :ok, %{ "message" => message} } = JSON.decode(content)

      # Reverse the message and use JSEX to re-encode a reply contatining
      # the reversed message.
      rev = String.reverse(message)
      { :ok, reply } = JSEX.encode(%{ reply: rev})

      #IO.puts("Message: #{message}")

      # The reply format here is a 4-tuple starting with :reply followed
      # by the body of the reply, in this case the tuple {:text, reply}
      {:reply, {:text, reply}, req, state}
    end
    def websocket_handle(_data, req, state) do
      {:ok, req, state}
    end
    def websocket_info({timeout, _ref, _foo}, req, state) do

      time = time_as_string()

      # encode a json reply in the variable 'message'
      { :ok, message } = JSON.encode(%{ time: time})


      # set a new timer to send a :timeout message back to this process a second
      # from now.
      :erlang.start_timer(1000, self(), [])

      # send the new message to the client. Note that even though there was no
      # incoming message from the client, we still call the outbound message
      # a 'reply'.  That makes the format for outbound websocket messages
      # exactly the same as websocket_handle()
      { :reply, {:text, message}, req, state}
    end

    # fallback message handler
    def websocket_info(_info, req, state) do
      {:ok, req, state}
    end

    def time_as_string do
      {hh,mm,ss} = :erlang.time()
      :io_lib.format("~2.10.0B:~2.10.0B:~2.10.0B",[hh,mm,ss])
        |> :erlang.list_to_binary()
    end

  end
end
