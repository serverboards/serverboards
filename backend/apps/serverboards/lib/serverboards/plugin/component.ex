require Logger

defmodule Serverboards.Plugin.Component do
  defstruct [
    id: nil,
    name: nil,
    type: nil,
    traits: [],
    extra: %{},
    plugin: nil, # only filled when out of plugin struct.
    description: nil,
    icon: nil
  ]
  import Serverboards.Plugin
  alias Serverboards.IO.Cmd

  @doc ~S"""
  Executes the command of the component and returns an RPC endpoint.

  Returns a Serverboards.IO.Cmd

  ## Example

    iex> {:ok, pw} = run("serverboards.test.auth/fake")
    iex> Serverboards.IO.Cmd.call pw, "ping"
    {:ok, "pong"}
    iex> Serverboards.IO.Cmd.call pw, "auth_token", %{ "token" => "XXX" }
    {:ok, "dmoreno@serverboards.io"}
    iex> Serverboards.IO.Cmd.call pw, "auth_token", %{ "token" => "XXXx" }
    {:ok, false}
    #iex> Serverboards.IO.Cmd.call pw, "dir"
    #["ping","auth_token","dir"]

  """
  def run(%Serverboards.Plugin.Component{ type: "cmd" } = component) do
    cmd = component.extra["command"]
    if cmd == "" or cmd == nil do
      {:error, :invalid_component}
    else
      plugin = case component.plugin do
        %Serverboards.Plugin{} = plugin ->
          plugin
        plugin_id when is_binary(plugin_id) ->
          Serverboards.Plugin.Registry.find(component.plugin)
      end
      fullcmd = "#{plugin.path}/#{cmd}"
      perms = case component.extra["perms"] do
        perms when is_list(perms) -> perms
        perms when is_binary(perms) -> String.split(perms)
        nil -> []
      end
      #Logger.info("Running command #{fullcmd} // #{inspect perms}")
      cmdopts = [
        env: get_env(component),
        cd: plugin.path
      ]
      Cmd.Supervisor.start_command fullcmd, [], cmdopts, [perms: perms]
    end
  end

  def run(plugin_component) when is_binary(plugin_component) do
    Logger.debug("Try run #{inspect plugin_component}")
    case Serverboards.Plugin.Registry.find(plugin_component) do
      nil -> {:error, :not_found}
      c ->
        # Logger.debug("Found component #{inspect c}")
        run(c)
    end
  end

  def run(%Serverboards.Plugin.Component{} = component) do
    raise "Cant run this type of component, needs to be of type cmd, is #{inspect component.type}"
  end

  @doc ~S"""
  Returns the environment that this component will use.

  Useful to pass the new home directory, the serveboards path and so on.
  """
  def get_env(%{ plugin: %{ id: id }}), do: get_env(id)
  def get_env(%{ plugin: id }) when is_binary(id), do: get_env(id)
  def get_env(id) when is_binary(id) do
    serverboards_path = Serverboards.Config.serverboards_path()
    home = "#{serverboards_path}/data/#{id}/"
    case File.mkdir_p(home) do
      {:error, err} ->
        Logger.error("Error creating directory for plugin #{id} at #{home}: #{inspect err}")
      _ -> :ok
    end
    system_env = Serverboards.Config.get_map(:env)
      |> Enum.map(fn {a,b} -> {String.to_charlist(a), String.to_charlist(b)} end)
    env = [
      {'HOME', to_charlist home},
      {'PLUGIN_ID', to_charlist id},
      {'SERVERBOARDS_PATH', to_charlist serverboards_path},
    ] ++ system_env
    # Logger.debug("Env is #{inspect env}")
    env
  end
end
