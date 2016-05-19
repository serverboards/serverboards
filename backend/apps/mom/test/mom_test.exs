defmodule Serverboards.MOMTest do
  use ExUnit.Case
  #@moduletag :capture_log


  doctest Serverboards.MOM
  doctest Serverboards.MOM.Channel
  doctest Serverboards.MOM.Channel.Broadcast
  doctest Serverboards.MOM.Channel.Named
  doctest Serverboards.MOM.Channel.PointToPoint
  doctest Serverboards.MOM.Tap
end
