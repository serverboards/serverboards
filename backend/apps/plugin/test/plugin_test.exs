require Logger

defmodule PluginTest do
  use ExUnit.Case
  doctest Serverboards.Plugin
  doctest Serverboards.Plugin.Component


  test "Start component, call method" do
    alias Serverboards.{Plugin, Router, Peer}
    reg = Plugin.Registry.read_dir("test")
    {:ok, component, method} = Router.lookup(reg, "serverboards.example.ls.ls.ls")
    {:ok, running_component} = Plugin.Component.start(component)
    Logger.debug("Try to run #{method}")
    res = Peer.call(running_component, method, [])

    assert Enum.count(res) > 0

    Plugin.Component.stop(running_component)
  end
end
