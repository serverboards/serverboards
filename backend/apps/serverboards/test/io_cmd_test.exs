require Logger

defmodule Serverboards.IO.CmdTest do
  use ExUnit.Case
  @moduletag :capture_log

  doctest Serverboards.IO.Cmd, import: true

end
