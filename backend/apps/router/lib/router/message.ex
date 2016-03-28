defmodule Serverboards.Router.Message do
	defstruct [
		id: nil,
		method: nil,
		payload: [],
		origin: nil,
	]

	alias Serverboards.Router.Message

	def new(method, payload, origin \\ nil) do
		%Message{
			method: method,
			payload: payload,
			origin: origin
		}
	end
end
