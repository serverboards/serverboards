defmodule Serverboards.MOM.RPC.Message do
	defstruct [
		method: nil,
		params: nil,
		context: nil # context at calling client
	]
end
