require Serverboards.Logger
alias Serverboards.Logger

defmodule Serverboards.Plugin.Component do
  defstruct [
    id: nil,
    name: nil,
    type: nil,
    traits: [],
    extra: %{},
    plugin: nil # only filled when out of plugin struct.
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
    iex> Serverboards.IO.Cmd.call pw, "auth", %{ "token" => "XXX" }
    {:ok, "dmoreno@serverboards.io"}
    iex> Serverboards.IO.Cmd.call pw, "auth", %{ "token" => "XXXx" }
    {:ok, false}
    #iex> Serverboards.IO.Cmd.call pw, "dir"
    #["ping","auth","dir"]

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
      Logger.info("Running command #{fullcmd} // #{inspect perms}")
      Cmd.start_link fullcmd, [], [], [perms: perms]
    end
  end

  def run(plugin_component) when is_binary(plugin_component) do
    Logger.debug("Try run #{inspect plugin_component}")
    case Serverboards.Plugin.Registry.find(plugin_component) do
      nil -> {:error, :not_found}
      c ->
        Logger.debug("Found component #{inspect c}")
        run(c)
    end
  end

  def run(%Serverboards.Plugin.Component{} = component) do
    raise "Cant run this type of component, needs to be of type cmd, is #{inspect component.type}"
  end

end
