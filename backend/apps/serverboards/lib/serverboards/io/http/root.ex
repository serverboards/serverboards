require Logger

defmodule Serverboards.IO.HTTP.Root do


  def init(_type, req, [frontend_path]) do
    {:ok, req, frontend_path}
  end

  def handle(request, frontend_path) do
    index_html = "#{frontend_path}/index.html"

    # Try to auth and set a new token
    params = Serverboards.IO.HTTP.Utils.get_params(request)
    vars = if params["auth"] do
      # replace auth for type, which is what the auth understands
      params = params
        |> Map.drop(["auth"])
        |> Map.put("type", Map.get(params, "auth"))

      case Serverboards.Auth.auth_and_get_token(params) do
        {:error, error} ->
          %{ "error" => to_string(error)}
        {:ok, token} ->
          %{ "token" => token}
      end
    else %{} end

    # render response
    {:ok, reply} = Serverboards.IO.HTTP.Utils.render_template(request, index_html, vars)

    {:ok, reply, frontend_path}
  end

  def terminate(reason, request, state) do
    if reason != {:normal, :shutdown} do
      Logger.error("Not normal root handler termination", request: request, state: state, reason: reason)
    end
    :ok
  end
end
