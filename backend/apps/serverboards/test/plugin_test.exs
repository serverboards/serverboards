
defmodule Serverboards.PluginTest do
  use ExUnit.Case
  #@moduletag :capture_log

  doctest Serverboards.Plugin.Parser, import: true
  doctest Serverboards.Plugin.Registry, import: true
  #doctest Serverboards.Auth.Permission
end
