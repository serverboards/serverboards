defmodule Serverboards.MOM.RPC do
	alias Serverboards.MOM.{RPC, Tap}

	 def tap(%RPC.Gateway{ uuid: uuid, request: request, reply: reply}) do
		 Tap.tap(request, "#{uuid}>")
		 Tap.tap(reply, "#{uuid}<")
	 end
end
