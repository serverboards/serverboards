require Logger

defmodule Serverboards.Plugin.Monitor do
  use ExFSWatch, dirs: Application.fetch_env! :serverboards, :plugin_paths

  def callback(:stop) do
    :ok
  end

  def callback(file_path, _events) do
    Logger.info("Detected plugin change at #{file_path}. Reloading plugin data.")
    Serverboards.Plugin.Registry.reload_plugins(Serverboards.Plugin.Registry)
  end
end
