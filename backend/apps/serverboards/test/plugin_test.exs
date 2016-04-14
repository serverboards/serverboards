
defmodule Serverboards.PluginTest do
  use ExUnit.Case
  #@moduletag :capture_log

  :ok = Application.ensure_started(:serverboards)

  doctest Serverboards.Plugin.Parser, import: true
  doctest Serverboards.Plugin.Registry, import: true
  doctest Serverboards.Plugin.Component, import: true
  #doctest Serverboards.Auth.Permission
end
