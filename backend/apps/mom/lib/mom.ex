defmodule Serverboards.MOM do
	@moduledoc ~S"""
	Message Oriented Middleware

	Implements basic MOM to allow Message passing between the users. It is
	used mainly as Request-Reply (RPC).

	Example of use:
		iex> alias Serverboards.MOM.{Channel, Tap, Message}
		iex> {:ok, ch} = Channel.Broadcast.start_link
		iex> Tap.tap(ch,"tap test")
		iex> {:ok, ag} = Agent.start_link(fn -> nil end ) # a singleton with value nil, will be updated
		iex> sub_id = Channel.subscribe(ch, fn _ -> Agent.update(ag, fn _ -> :updated end) end)
		iex> Agent.get(ag, &(&1))
		nil
		iex> Channel.send(ch, %Message{})
		iex> Agent.get(ag, &(&1))
		:updated
		iex> Agent.update(ag, fn _ -> nil end)
		iex> Channel.unsubscribe(ch, sub_id) # unsubscribe, should not update
		iex> Channel.send(ch, %Message{})
		iex> Agent.get(ag, &(&1))
		nil

	"""

	use Application

	def start(_type, _args) do
		Serverboards.MOM.Supervisor.start_link
	end
end
