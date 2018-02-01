require Logger

defmodule Serverboards.ExEvalTest do
  use ExUnit.Case
  @moduletag :capture_log

  test "basic expr" do
    assert ExEval.eval("true") == {:ok, true}
    assert ExEval.eval("false") == {:ok, false}

    assert ExEval.eval("true == true") == {:ok, true}
    assert ExEval.eval("true == false") == {:ok, false}
    assert ExEval.eval("false == false") == {:ok, true}
    assert ExEval.eval("true == false") == {:ok, false}

    assert ExEval.eval("true or true") == {:ok, true}
    assert ExEval.eval("true or false") == {:ok, true}
    assert ExEval.eval("false or true") == {:ok, true}
    assert ExEval.eval("false or false") == {:ok, false}

    assert ExEval.eval("true and true") == {:ok, true}
    assert ExEval.eval("true and false") == {:ok, false}
    assert ExEval.eval("false and true") == {:ok, false}
    assert ExEval.eval("false and false") == {:ok, false}

    assert ExEval.eval("1") == {:ok, 1}
    assert ExEval.eval("1 + 1") == {:ok, 2}
    assert ExEval.eval("1 + 1 + 1") == {:ok, 3}
    assert ExEval.eval("(1 + 1) + 1") == {:ok, 3}
    assert ExEval.eval("(1 + 1) + 1") == {:ok, 3}
    assert ExEval.eval("1 + 2 + 3") == {:ok, 6}
    assert ExEval.eval("1 * 2 + 3") == {:ok, 5}
    assert ExEval.eval("1 + 2 * 3") == {:ok, 7}
    assert ExEval.eval("(1 + 2) * 3") == {:ok, 9}

    assert ExEval.eval("'test'") == {:ok, "test"}
    assert ExEval.eval("'test' == 'test'") == {:ok, true}
    assert ExEval.eval("'test' != 'test'") == {:ok, false}
    assert ExEval.eval("'test' == 'no test'") == {:ok, false}
    assert ExEval.eval("'no' + ' test' == 'no test'") == {:ok, true}

    assert ExEval.eval("10 > 0") == {:ok, true}
    assert ExEval.eval("10 >= 0") == {:ok, true}
    assert ExEval.eval("10 >= 10") == {:ok, true}
    assert ExEval.eval("0 >= 10") == {:ok, false}
    assert ExEval.eval("0 > 10") == {:ok, false}

    assert ExEval.eval("10 < 0") == {:ok, false}
    assert ExEval.eval("10 <= 0") == {:ok, false}
    assert ExEval.eval("10 <= 10") == {:ok, true}
    assert ExEval.eval("0 < 10") == {:ok, true}
    assert ExEval.eval("0 <= 10") == {:ok, true}
  end

  test "with vars" do
    context = [%{
        "A" => "test",
        "B" => %{ "C" => "got deeper" }
      }, %{
        "D" => "more contexts"
      } ]
    assert ExEval.eval("A == 'test'", context) == {:ok, true}
    assert ExEval.eval("A != 'test'", context) == {:ok, false}
    assert ExEval.eval("A != 'no test'", context) == {:ok, true}

    assert ExEval.eval("B == 'test'", context) == {:ok, false}
    assert ExEval.eval("B.C == 'got deeper'", context) == {:ok, true}

    assert ExEval.eval("D == 'more contexts'", context) == {:ok, true}

    assert ExEval.eval("Z == 'test'", context) == {:error, {:unknown_var, "Z", context}}
  end

  test "Bug use proper and" do
    assert ExEval.eval(
        "(A.state == \"down\") and (A.for > 10)",
        [%{ "A" => %{ "state" => "down", "for" => 15}}]
      ) == {:ok, true}
    assert ExEval.eval(
        "(A.state == \"down\") and (A.for > 10)",
        [%{ "A" => %{ "state" => "down", "for" => 5}}]
      ) == {:ok, false}
    assert ExEval.eval(
        "(A.state == \"down\") and (A.for > 10)",
        [%{ "A" => %{ "state" => "up", "for" => 15}}]
      ) == {:ok, false}
    assert ExEval.eval(
        "A.state == \"down\" and A.for > 10",
        [%{ "A" => %{ "state" => "down", "for" => 15}}]
      ) == {:ok, true}
    assert ExEval.eval(
        "A.state == \"down\" and A.for > 10",
        [%{ "A" => %{ "state" => "down", "for" => 5}}]
      ) == {:ok, false}
    assert ExEval.eval(
        "A.state == \"down\" and A.for > 10",
        [%{ "A" => %{ "state" => "up", "for" => 15}}]
      ) == {:ok, false}
  end
end
