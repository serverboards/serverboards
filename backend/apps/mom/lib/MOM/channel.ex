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
		:ok
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
	Send a message to a named channel by atom
	"""
	def send(channel, %Message{} = message) when is_atom(channel) do
		channel = Channel.Named.ensure_exists(channel)
		Channel.send(channel, message)
	end

	@doc "Sends a message to a channel"
	def send(channel, %Message{} = message) do
		GenServer.call(channel, {:send, message})
	end

	@doc ~S"""
	Subscribes to a channel.

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
		iex> Channel.send(:empty, %Message{})
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
	def subscribe(channel, subscriber) when is_atom(channel) do
		channel = Channel.Named.ensure_exists(channel)
		#Logger.debug("Got channel #{inspect channel}")
		subscribe(channel, subscriber)
	end

	def subscribe(orig, dest) when is_pid(dest) do
		#Logger.debug("Subscribe #{inspect orig} send to #{inspect dest}")
		subscribe(orig, fn msg -> Channel.send(dest, msg) end)
	end

	def subscribe(channel, subscriber) do
		#Logger.debug("Subscribe #{inspect channel} executes #{inspect subscriber}")
		GenServer.call(channel, {:subscribe, subscriber})
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
			subscribers: %{}
			}}
	end

	def handle_call({:subscribe, s}, _, state) do
		{:reply, state.maxid,	%{ state |
				subscribers: Map.put(state.subscribers, state.maxid, s),
				maxid: state.maxid+1
			}	}
	end

	def handle_call({:unsubscribe, s}, _, state) do
		{:reply, :ok, %{ state |
			subscribers: Map.delete(state.subscribers, s)
		}}
	end

	@doc ~S"""
	Handles normal send of messages, including :deadletter and :invalid message
	management.
	"""
	def handle_call({:send, msg}, _, state) do
		if Enum.count(state.subscribers) == 0 and msg.error != :deadletter do
			Channel.send(:deadletter, %{msg | error: :deadletter})
		end
		for {_,f} <- state.subscribers do
			try do
				f.(msg)
			rescue
				e ->
					Channel.send(:invalid, %Message{ msg | error: {e, System.stacktrace()}} )
					Logger.error("Error sending #{inspect msg} to #{inspect f}: #{inspect e}. Sent to :invalid messages channel.")
					Logger.error( Exception.format_stacktrace System.stacktrace )
			end
		end
		{:reply, :ok, state}
	end
end
