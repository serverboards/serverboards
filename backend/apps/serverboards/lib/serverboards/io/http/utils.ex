require Logger

defmodule Serverboards.IO.HTTP.Utils do
  @moduledoc """
  Several utility functions for HTTP subsystem
  """

  def get_params(req) do
    # Logger.debug(inspect req, pretty: true)
    content_type =
      case :cowboy_req.parse_header("content-type", req) do
        {:ok, {content, type, _}, _} ->
          {content, type}

        _other ->
          :unknown
      end

    # Logger.debug("Got data: #{inspect content_type}")
    params =
      cond do
        content_type == {"multipart", "form-data"} ->
          get_multipart_params(req)

        content_type == {"application", "json"} ->
          {:ok, body, _} = :cowboy_req.body(req)
          Poison.decode!(body)

        content_type == {"application", "x-www-form-urlencoded"} ->
          {:ok, params, _} = :cowboy_req.body_qs(req)
          # Logger.debug("url encoded")
          params

        true ->
          # Logger.debug("other")
          {params, _} = :cowboy_req.qs_vals(req)
          params
      end

    Map.new(params)
  end

  def get_multipart_params(req, params \\ []) do
    case :cowboy_req.part(req) do
      {:ok, headers, req2} ->
        case :cow_multipart.form_data(headers) do
          {:data, name} ->
            {:ok, body, req3} = :cowboy_req.part_body(req2)

            get_multipart_params(req3, [{name, body} | params])

          other ->
            Logger.debug("Dont know how to parse multipart type #{inspect(other)}")
            get_multipart_params(req2, params)
        end

      {:done, _} ->
        params

      other ->
        Logger.debug("Dont know how to parse multipart part #{inspect(other)}")
        params
    end
  end

  def render_template(request, requested_filename, vars) do
    # Logger.debug("Request static handler: #{requested_filename}")
    case File.read(requested_filename) do
      {:ok, content} ->
        {mime1, mime2, _} = :cow_mimetypes.web(requested_filename)
        mimetype = "#{mime1}/#{mime2}"

        {:ok, content} = Serverboards.Utils.Template.render(content, vars, remove_empty: true)

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
        Logger.debug("Could not read static file at #{requested_filename}")

        :cowboy_req.reply(
          404,
          [],
          "",
          request
        )
    end
  end

  def get_file(request, requested_filename) do
    # Logger.debug("Request static handler: #{requested_filename}")
    case File.read(requested_filename) do
      {:ok, content} ->
        {mime1, mime2, _} = :cow_mimetypes.web(requested_filename)
        mimetype = "#{mime1}/#{mime2}"

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
        Logger.debug("Could not read static file at #{requested_filename}")

        :cowboy_req.reply(
          404,
          [],
          "",
          request
        )
    end
  end
end
