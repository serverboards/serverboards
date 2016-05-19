defmodule MOMTest do
  use ExUnit.Case
  #@moduletag :capture_log


  doctest MOM
  doctest MOM.Channel
  doctest MOM.Channel.Broadcast
  doctest MOM.Channel.Named
  doctest MOM.Channel.PointToPoint
  doctest MOM.Tap
end
