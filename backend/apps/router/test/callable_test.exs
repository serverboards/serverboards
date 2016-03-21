defmodule Serverboards.CallableTest do
  use ExUnit.Case
  doctest Serverboards.Router.Callable

  test "Functions are callable" do
    assert Serverboards.Router.Callable.call(fn [] -> "echo" end, "", []) == "echo"
  end
end
