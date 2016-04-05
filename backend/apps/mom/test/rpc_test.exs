defmodule Serverboards.RPCTest do
  use ExUnit.Case
  @moduletag :capture_log
  doctest Serverboards.MOM.RPC
  doctest Serverboards.MOM.RPC.MethodCaller

	alias Serverboards.MOM.RPC

	test "Simple RPC use" do
		{:ok, rpc} = RPC.start_link
		RPC.tap( rpc )

		RPC.add_method rpc, "echo", &(&1), async: true

		# simple direct call
		assert RPC.call(rpc, "echo", "hello", 0) == "hello"

		# simple call through chain
		{:ok, worker} = RPC.start_link
		RPC.tap( worker )

		RPC.add_method worker, "ping", fn _ ->
			"pong"
		end
		RPC.chain rpc, worker
		assert RPC.call(rpc, "ping", [], 0) == "pong"

		# call unknown
		assert_raise Serverboards.MOM.RPC.UnknownMethod, fn ->
			RPC.call(rpc, "pong", nil, 0)
		end

		# chain a second worker
		{:ok, worker2} = RPC.start_link
		RPC.tap( worker2 )
		RPC.add_method worker2, "pong", fn _ ->
			"pong"
		end

		# still not chained, excpt
		assert_raise Serverboards.MOM.RPC.UnknownMethod, fn ->
			RPC.call(rpc, "pong", nil, 0)
		end

		# now works
		RPC.chain rpc, worker2
		assert RPC.call(rpc, "pong", nil, 0) == "pong"
	end


  test "RPC method with pattern matching" do
    {:ok, rpc} = RPC.start_link
    RPC.tap( rpc )

    RPC.add_method rpc, "echo", fn
      [_] -> "one item"
      [] -> "empty"
      %{ type: _ } -> "map with type"
    end, async: true

    assert RPC.call(rpc, "echo", [], 1) == "empty"
    assert RPC.call(rpc, "echo", [1], 1) == "one item"
    assert RPC.call(rpc, "echo", %{}, 1) == nil
    assert RPC.call(rpc, "echo", %{ type: :test}, 1) == "map with type"
  end
end
