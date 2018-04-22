defmodule Serverboards.PluginDocTest do
  use ExUnit.Case
  @moduletag :capture_log
  @moduletag timeout: 10_000

  :ok = Application.ensure_started(:serverboards)

  doctest Serverboards.Plugin.Parser, import: true
  doctest Serverboards.Plugin.Registry, import: true
  doctest Serverboards.Plugin.Component, import: true
  doctest Serverboards.Plugin.Runner, import: true

  setup_all do
    Test.Ecto.setup()
  end
end
