require Logger

defmodule Serverboards.Plugin.Installer do
  def install(url) do
    plname = Path.basename(url)
    plugindir = "#{Serverboards.Config.serverboards_path}/plugins/"
    finalpath = "#{plugindir}/#{plname}"

    {output, exitcode} = System.cmd(
      "git", ["clone", url, finalpath],
      cd: plugindir, stderr_to_stdout: true
      )
    if exitcode == 0 do
      Logger.info("Installed plugin from #{url} at #{finalpath}", output: output, url: url, path: finalpath)
      Serverboards.Plugin.Registry.reload_plugins
      :ok
    else
      Logger.error("Error installing plugin from #{url} at #{finalpath}", output: output, url: url, path: finalpath)
      {:error, output}
    end
  end
end
