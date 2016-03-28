require Logger

defmodule Serverboards.MOM.Channel do
	use GenServer
	@moduledoc ~S"""
	A simple channel of communication. Subscribers are functions that will be just
	called when somebody sends a message.

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
	"""

	@doc ~S"""
	Starts the link
	"""
	def start_link do
		GenServer.start_link(__MODULE__, :ok, [])
	end

	def send(channel, %Serverboards.MOM.Message{} = message) do
		GenServer.call(channel, {:send, message})
	end

	def subscribe(channel, subscriber) do
		GenServer.call(channel, {:subscribe, subscriber})
	end

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

	def handle_call({:send, msg}, _, state) do
		for {_,f} <- state.subscribers do
			try do
				f.(msg)
			rescue
				e ->
					Logger.error("Error sending #{inspect msg} to #{inspect f}: #{inspect e}")
			end
		end
		{:reply, :ok, state}
	end
end
