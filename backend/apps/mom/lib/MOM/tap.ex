require Logger

defmodule MOM.Tap do
	@moduledoc ~S"""
	Sends to logger all messages on this channel.

		iex> {:ok, ch} = MOM.Channel.Broadcast.start_link
		iex> tap_id = MOM.Tap.tap(ch, "my tap")
		iex> MOM.Channel.send(ch, %MOM.Message{payload: "test", id: 1})
		:ok
		iex> MOM.Tap.untap(ch, tap_id)
		:ok
	"""
	def tap(channel, id \\ "#") do
		MOM.Channel.subscribe(channel, fn msg ->
			Logger.info("Tap[#{id}]: #{inspect msg}")
			:nok # at P2P channels, this does not consume message
		end, front: true)
	end

	def untap(channel, tap_id) do
		MOM.Channel.unsubscribe(channel, tap_id)
	end
end
