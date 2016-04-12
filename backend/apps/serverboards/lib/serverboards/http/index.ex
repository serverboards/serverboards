defmodule Serverboards.HTTP.Index do
  use Serverboards.HTTP.Web, :controller

  def index(conn, _params) do
    "index.html"
  end
end
