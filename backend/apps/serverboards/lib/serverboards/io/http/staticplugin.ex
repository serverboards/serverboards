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
    {plugin, _} = :cowboy_req.binding(:plugin, request)
    {rest, _} = :cowboy_req.path_info(request)
    filepath = Enum.join(rest, "/")

    if String.contains?(filepath, "..") do
      raise "Invalid path"
    end

    plugin = Serverboards.Plugin.Registry.find(plugin)
    requested_filename = "#{plugin.path}/static/#{filepath}"
    {:ok, reply} = Serverboards.IO.HTTP.Utils.get_file(request, requested_filename)

    {:ok, reply, state}
  end

  def terminate(reason, request, state) do
    if reason != {:normal, :shutdown} do
      Logger.error("Not normal static handler termination",
        request: request,
        state: state,
        reason: reason
      )
    end

    :ok
  end
end
