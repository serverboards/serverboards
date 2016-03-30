defmodule Serverboards.RPCTest do
  use ExUnit.Case
  @moduletag :capture_log
	doctest Serverboards.MOM.RPC.Gateway

	alias Serverboards.MOM.RPC

	test "Simple RPC use" do
		{:ok, rpc} = RPC.Gateway.start_link
		RPC.tap( rpc )

		RPC.Gateway.add_method rpc, "echo", &(&1), async: true

		# simple direct call
		assert RPC.Gateway.call(rpc, "echo", "hello", 0) == "hello"

		# simple call through chain
		{:ok, worker} = RPC.Gateway.start_link
		RPC.tap( worker )

		RPC.Gateway.add_method worker, "ping", fn _ ->
			"pong"
		end
		RPC.Gateway.chain rpc, worker
		assert RPC.Gateway.call(rpc, "ping", [], 0) == "pong"

		# call unknown
		assert_raise Serverboards.MOM.RPC.Gateway.UnknownMethod, fn ->
			RPC.Gateway.call(rpc, "pong", nil, 0)
		end

		# chain a second worker
		{:ok, worker2} = RPC.Gateway.start_link
		RPC.tap( worker2 )
		RPC.Gateway.add_method worker2, "pong", fn _ ->
			"pong"
		end

		# still not chained, excpt
		assert_raise Serverboards.MOM.RPC.Gateway.UnknownMethod, fn ->
			RPC.Gateway.call(rpc, "pong", nil, 0)
		end

		# now works
		RPC.Gateway.chain rpc, worker2
		assert RPC.Gateway.call(rpc, "pong", nil, 0) == "pong"
	end
end
