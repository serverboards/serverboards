require Logger

defmodule Serverboards.Plugin.Installer do
  def install(url) do
    plname = Path.basename(url)
    plugindir = "#{Serverboards.Config.serverboards_path}/plugins/"
    finalpath = "#{plugindir}/#{plname}"

    with :ok <- install_from_git(url, plugindir, finalpath),
      :ok <- execute_postinst(finalpath)
    do
      :ok
    end
  end
  def install_from_git(url, plugindir, finalpath) do
    File.mkdir_p(plugindir)

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
  def execute_postinst(finalpath) do
    if File.exists?("#{finalpath}/manifest.yaml") do
      {:ok, yaml} = File.read("#{finalpath}/manifest.yaml")
      data = YamlElixir.read_from_string(yaml)

      if is_list(data) do
        raise "Manifest at #{finalpath} is a list. It should return a map."
      end

      plugin_id = Map.get(data, "id")
      postinst = Map.get(data, "postinst")
      if postinst do
        cmd = "#{finalpath}/#{postinst}"

        env = Serverboards.Plugin.Component.get_env(plugin_id) |> Enum.map(fn {k,v} ->
          {to_string(k), to_string(v)}
        end) # Port requires binary as in '' and System.cmd strings as "". WTF!

        cmdopts = [
          env: env,
          cd: finalpath
        ]

        Logger.info("Executing postinst for #{cmd}", plugin: data, path: finalpath)
        {log, exitcode} = System.cmd cmd, [], cmdopts


        if exitcode == 0 do
          Logger.info(log, plugin: data, exitcode: 0, file: cmd, line: "--")

          mark_as_ok(plugin_id)

          :ok
        else
          Logger.error(log, plugin: data, exitcode: exitcode, file: cmd, line: "--")

          mark_as_broken(plugin_id)

          {:error, :broken_postinst}
        end
      else
        mark_as_ok(plugin_id)
        :ok
      end
    else
      {:error, "Plugin has no manifest.yaml"}
    end
  end

  def mark_as_ok(plugin_id) do
    changes = Serverboards.Settings.get("broken_plugins", %{})
      |> Map.drop([plugin_id])
    Serverboards.Settings.update "broken_plugins", changes, %{ email: "system", perms: ["settings.update"]}
  end

  def mark_as_broken(plugin_id) do
    changes = Serverboards.Settings.get("broken_plugins", %{})
      |> Map.put(plugin_id, true)
    Serverboards.Settings.update "broken_plugins", changes, %{ email: "system", perms: ["settings.update"]}
  end
end
