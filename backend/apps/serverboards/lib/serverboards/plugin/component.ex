require Logger

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

    iex> {:ok, pw} = run("serverboards.test.auth/auth.test")
    iex> Serverboards.IO.Cmd.call pw, "ping"
    "pong"
    iex> Serverboards.IO.Cmd.call pw, "auth", %{ "token" => "XXX" }
    "dmoreno@serverboards.io"
    iex> Serverboards.IO.Cmd.call pw, "auth", %{ "token" => "XXXx" }
    false
    #iex> Serverboards.IO.Cmd.call pw, "dir"
    #["ping","auth","dir"]

  """
  def run(%Serverboards.Plugin.Component{ type: "cmd" } = component) do
    cmd = component.extra["command"]
    fullcmd = "#{component.plugin.path}/#{cmd}"
    Logger.debug("Running command #{fullcmd}")
    Cmd.start_link fullcmd
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
