defmodule Serverboards.MOM.RPC do
	alias Serverboards.MOM.{RPC, Tap}

	def tap(%RPC.Gateway{ uuid: uuid, request: request, reply: reply}, id \\ nil) do
		if id do
			Tap.tap(request, "#{id}>")
			Tap.tap(reply, "#{id}<")
		else
			Tap.tap(request, "#{uuid}>")
			Tap.tap(reply, "#{uuid}<")
		end
	 end
end
