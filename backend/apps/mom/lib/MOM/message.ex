defmodule MOM.Message do
	defstruct [
		id: nil,
		payload: nil,
		reply_to: nil,
		error: nil,
	]
end
