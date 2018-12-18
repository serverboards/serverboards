require Logger

defmodule Serverboards.UtilsTest do
  use ExUnit.Case
  @moduletag :capture_log

  import Serverboards.Utils

  test "Map diff" do
    Logger.debug("OK")
    a = %{"A" => "ok", "B" => %{"C" => "c", "D" => "d"}, "C" => [1]}
    b = %{"A" => "nok", "B" => %{"C" => "c", "D" => "d2"}, "C" => [1, 2]}
    c = %{"A" => "nok", "B" => %{"C" => "c", "D" => "d"}, "C" => [1, 2]}
    e = %{"A" => "ok", "B" => %{"C" => "c", "D" => "d"}}

    assert map_diff(a, a) == %{}
    assert map_diff(a, c) == %{"A" => "nok", "C" => [1, 2]}
    assert map_diff(b, c) == %{"B" => %{"D" => "d"}}
    assert map_diff(a, b) == %{"A" => "nok", "B" => %{"D" => "d2"}, "C" => [1, 2]}
    assert map_diff(a, e) == %{"C" => nil}
  end
end
