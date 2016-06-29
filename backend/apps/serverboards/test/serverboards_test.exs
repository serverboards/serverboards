defmodule ServerboardsTest do
  use ExUnit.Case
  @moduletag :capture_log
  
  doctest Serverboards
  doctest Serverboards.Utils, import: true
  doctest Serverboards.Utils.Decorators, import: true

end
