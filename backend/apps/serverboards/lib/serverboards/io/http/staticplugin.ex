require Logger

defmodule Serverboards.IO.HTTP.StaticPlugin do
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
        Logger.debug("Could not read static file at #{requested_filename}")
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
