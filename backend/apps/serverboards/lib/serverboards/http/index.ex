require Logger

defmodule Serverboards.HTTP.Index do
  use Serverboards.HTTP.Web, :controller

  def init(a) do
    Logger.debug("Index init #{inspect a}")
    a
  end

  def index(conn, _params) do
    conn
      |> redirect(to: "/index.html")
  end

  def ws(conn, _params) do
    conn
      |> send_resp(200, "Upgrade to WS")
  end

end
