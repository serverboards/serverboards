defmodule Serverboards.HTTP.ErrorView do
  use Serverboards.HTTP.Web, :view

  def render("404.html", _assigns) do
    "Page not found"
  end

  def render("500.html", _assigns) do
    "Server internal error"
  end
end
