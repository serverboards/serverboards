require Logger

defmodule MOM.Channel.Named do
	@moduledoc ~S"""
	Allows to have named channels

	This channels are automatically created at subscription and send, so no
	previous initialization is needed.

	This channels will be childs of a Channel.Named controller at the supervision
	tree.

	## Example

		iex> alias MOM.Channel
		iex> require Logger
		iex> mch = Channel.Named.ensure_exists("my-channel")
		iex> och = Channel.Named.ensure_exists(:atom)
		iex> mch == och
		false
		iex> Channel.Named.ensure_exists("my-channel")
		mch
		iex> Channel.subscribe(mch, &Logger.info("Test" ++ (inspect &1)))
		0
	"""
	def start_link do
		Agent.start_link(fn -> %{} end, name: __MODULE__)
	end

	def ensure_exists(name) do
		Agent.get_and_update(__MODULE__, fn channels ->
			case Map.get(channels, name) do
				nil ->
					{:ok, nch} = MOM.Channel.Broadcast.start_link
					channels = Map.put(channels, name, nch)
					{nch, channels}
				ch ->
					{ch, channels}
			end
		end)
	end

end

defimpl MOM.Channel, for: Atom do
	alias MOM.Channel

	@doc "Subscribe to a named channel by atom"
	def subscribe(channel, subscriber, options) do
		channel = Channel.Named.ensure_exists(channel)
		Channel.subscribe(channel, subscriber, options)
	end
	@doc "Unsubscribe to a named channel by atom"
	def unsubscribe(channel, subscriber) do
		channel = Channel.Named.ensure_exists(channel)
		Channel.unsubscribe(channel, subscriber)
	end
	@doc "Sends message to a named channel"
	def send(channel, %MOM.Message{} = message, options) do
		channel = Channel.Named.ensure_exists(channel)
		Channel.send(channel, message, options)
	end
end
