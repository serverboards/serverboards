require Logger

defmodule Serverboards.MOM.Channel do
	use GenServer
	@moduledoc ~S"""
	A simple channel of communication. Subscribers are functions that will be just
	called when somebody sends a message.

	## Examples

		iex> require Logger
		iex> alias Serverboards.MOM.{Message, Channel}
		iex> {:ok, ch} = Channel.start_link
		iex> Channel.subscribe(ch, fn msg -> Logger.info("Message1 #{inspect msg}") end)
		0
		iex> Channel.subscribe(ch, fn msg -> Logger.info("Message2  #{inspect msg}") end)
		1
		iex> Channel.send(ch, %Message{ payload: %{method: "echo", param: "Hello world" }})
		:ok
		iex> Channel.unsubscribe(ch, 1)
		:ok

	It is allowed to call the channels after an atom

		iex> require Logger
		iex> alias Serverboards.MOM.{Message, Channel}
		iex> Channel.Named.start_link
		iex> id = Channel.subscribe(:deadletter, fn m -> Logger.error("Deadletter #{inspect m}") end)
		iex> Channel.send(:empty, %Message{})
		:empty
		iex> Channel.unsubscribe(:deadletter, id)
		:ok

	In fact there are two special named channels: :deadletter, for messages that
	were not processed by any subscriptor, and :invalid for messages that raised an
	exception at process time.
	"""
	alias Serverboards.MOM.{Channel, Message}

	@doc ~S"""
	Starts the link
	"""
	def start_link do
		GenServer.start_link(__MODULE__, :ok, [])
	end

	@doc ~S"""
	Send a message to a channel.

	The channel can be a previously created channel or a named channel by an atom.

	Returns:
	 * `:ok` if all received the message and no error
	 * `:empty` if no receivers
	 * `:nok` some receiver raised an exception.

	## Examples

	Depending on how succesful was the `send` it returns diferent values:

		iex> alias Serverboards.MOM.{Channel, Message}
		iex> {:ok, ch} = Channel.start_link
		iex> Channel.send(ch, %Message{})
		:empty
		iex> Channel.subscribe(ch, fn _ -> :ok end)
		iex> Channel.send(ch, %Message{})
		:ok
		iex> Channel.subscribe(ch, fn _ -> raise "To return :nok" end)
		iex> Channel.send(ch, %Message{})
		:nok

	Sending to named channels:

		iex> alias Serverboards.MOM.{Channel, Message}
		iex> Channel.send(:empty, %Message{})
		:empty

	"""
	def send(channel, %Message{} = message) when is_atom(channel) do
		channel = Channel.Named.ensure_exists(channel)
		Channel.send(channel, message)
	end

	def send(channel, %Message{} = message) do
		GenServer.call(channel, {:send, message})
	end

	def send(channel, %Message{} = message, options) do
		GenServer.call(channel, {:send, message, options})
	end

	@doc ~S"""
	Subscribes to a channel.

	In this basic channels implementation the return value of the called function
	is discarded, but on other implementations may require `:ok`, `:nok` or `:empty`
	for further	processing, so its good practive to return these values.

	Options:

	* `front:` (true|false) -- The subscriber is added at the front so it will be called first.
	  Useful for tapping, for example. Default false.

	## Examples

	A subscription normally calls a function when a message arrives

		iex> alias Serverboards.MOM.{Channel, Message}
		iex> require Logger
		iex> {:ok, ch} = Channel.start_link
		iex> Channel.subscribe(ch, fn _ ->
		...>   Logger.info("Called")
		...>   end)
		iex> Channel.send(ch, %Serverboards.MOM.Message{ id: 0 })
		:ok

	Its possible to subscribe to named channels

		iex> alias Serverboards.MOM.{Channel, Message}
		iex> Channel.subscribe(:named_channel, fn _ -> :ok end)
		iex> Channel.send(:named_channel, %Message{})
		:ok

	Its possible to subscribe a channel to a channel. This is useful to create
	tree like structures where some channels automatically write to another.

	All messages in orig are send automatically to dest.

		iex> require Logger
		iex> alias Serverboards.MOM.{Channel, Message}
		iex> {:ok, a} = Channel.start_link
		iex> {:ok, b} = Channel.start_link
		iex> Channel.subscribe(a, b)
		iex> Channel.subscribe(b, fn _ ->
		...>    Logger.info("B called")
		...>    end)
		iex> Channel.send(a, %Serverboards.MOM.Message{ id: 0, payload: "test"})
		:ok
	"""
	def subscribe(channel, subscriber) do
		subscribe(channel, subscriber, [])
	end

	def subscribe(channel, subscriber, options) when is_atom(channel) do
		channel = Channel.Named.ensure_exists(channel)
		#Logger.debug("Got channel #{inspect channel}")
		subscribe(channel, subscriber, options)
	end

	def subscribe(orig, dest, options) when is_pid(dest) do
		#Logger.debug("Subscribe #{inspect orig} send to #{inspect dest}")
		subscribe(orig, fn msg -> Channel.send(dest, msg) end, options)
	end

	def subscribe(channel, subscriber, options) do
		#Logger.debug("Subscribe #{inspect channel} executes #{inspect subscriber}")
		GenServer.call(channel, {:subscribe, subscriber, options})
	end


	@doc "Unsubscribe to a named channel by atom"
	def unsubscribe(channel, subscriber)  when is_atom(channel)do
		channel = Channel.Named.ensure_exists(channel)
		unsubscribe(channel, subscriber)
	end

	@doc "Unsubscribes to a channel"
	def unsubscribe(channel, subscriber) do
		GenServer.call(channel, {:unsubscribe, subscriber})
	end


	## Server impl.

	@doc ~S"""
	state is just the subscriber list callbacks, it will call each function
	with the message.
	"""
	def init(:ok) do
		{:ok, %{
			maxid: 0,
			subscribers: [] # each {id, fn}, almost a map, but with ordering. id used to unsubscribe.
			}}
	end

	def handle_call({:subscribe, s, options}, _, state) do
		subscribers = if Keyword.get(options, :front, false) do
			[{state.maxid, s}] ++ state.subscribers
		else
			state.subscribers ++ [{state.maxid, s}]
		end

		{:reply, state.maxid,	%{ state |
				subscribers: subscribers,
				maxid: state.maxid+1
			}	}
	end

	def handle_call({:unsubscribe, s}, _, state) do
		{:reply, :ok, %{ state |
			subscribers: Enum.filter(state.subscribers, fn {id, _ } -> id != s end)
		}}
	end

	@doc ~S"""
	Handles normal send of messages, including :deadletter and :invalid message
	management.
	"""
	def handle_call({:send, msg}, _, state) do
		ok = if Enum.count(state.subscribers) == 0 and msg.error != :deadletter do
			#Logger.warn("Sending #{inspect msg} to :deadletter messages channel.")
			Channel.send(:deadletter, %{msg | error: :deadletter})
			:empty
		else
			oks = for {_,f} <- state.subscribers do
				try do
					f.(msg)
					:ok
				rescue
					e ->
						Channel.send(:invalid, %Message{ msg | error: {e, System.stacktrace()}} )
						Logger.error("Error sending #{inspect msg} to #{inspect f}: #{inspect e}. Sent to :invalid messages channel.")
						Logger.error( Exception.format_stacktrace System.stacktrace )
						:nok
					end
				end
			if Enum.any?(oks, &(&1 != :ok)) do
				:nok
			else
				:ok
			end
		end
		{:reply, ok, state}
	end

	def handle_call({:send, msg, options}, from, state) do
		# forces send to all, this is a hack over pointopoint channels
		if Enum.member? options, :all do
			handle_call({:send, msg}, from, state)
		else
			raise "Only allowed option is :all"
		end
	end
end
