require Logger

defmodule Serverboards.MOM.Channel.PointToPoint do
	@moduledoc ~S"""
	Special channel on which only one competing consumer consume messages.

	Each consumer is called in order, and MUST return :ok or :nok
	if :nok, next in line will try. If none consumes its sent to
	:deadletter. If any consumer throws an exceptionis sent to :invalid messages.

	If sent to :deadletter or :invalid, returns :nok, else returns :ok. This eases
	composability.

	## Example

	To use it, use normal Channel methods (send, subscribe, unsubscribe) on a
	PointToPoint.start_link.

		iex> require Logger
		iex> alias Serverboards.MOM.{Channel, Message, RPC}
		iex> {:ok, ch} = Channel.PointToPoint.start_link
		iex> Channel.subscribe(ch, fn msg ->
		...>	case msg.payload do
		...>		%RPC.Message{ method: "ping", params: [_] } ->
		...>			Logger.info("Consumed ping message")
		...>			:ok
		...>		_ ->
		...>			:nok
		...>	end
		...>end)
		iex> Channel.subscribe(ch, fn msg ->
		...>	case msg.payload do
		...>		%RPC.Message{ method: "pong", params: [_] } ->
		...>			Logger.info("Consumed pong message")
		...>			:ok
		...>		_ ->
		...>			:nok
		...>	end
		...>end)
		iex> Channel.send(ch, %Message{ id: 0, payload: %RPC.Message{ method: "ping", params: ["Hello"]}} )
		:ok
		iex> Channel.send(ch, %Message{ id: 0, payload: %RPC.Message{ method: "pong", params: ["Hello"]}} )
		:ok
		iex> Channel.send(ch, %Message{ id: 0, payload: %RPC.Message{ method: "other", params: ["Hello"]}} )
		:nok
	"""
	use GenServer

	alias Serverboards.MOM.{Message, Channel}

	def start_link do
		GenServer.start_link(__MODULE__, :ok, [])
	end

	## Server impl

	def init(:ok) do
		Channel.init(:ok)
	end

	@doc ~S"""
	Calls all subscribers in order until one returns :ok. If none returns :ok,
	returns :nok.

	If no subscribers returns :empty
	"""
	def handle_call({:send, msg}, _, state) do
		ok = if Enum.count(state.subscribers) == 0 do
			:empty
		else
			any = Enum.any?(state.subscribers, fn {_, f} ->
				ok = try do
					f.(msg)
				rescue
					e ->
						Channel.send(:invalid, %Message{ msg | error: {e, System.stacktrace()}} )
						Logger.error("Error sending #{inspect msg} to #{inspect f}. Sent to :invalid messages channel.\n#{inspect e}\n#{ Exception.format_stacktrace System.stacktrace }")
						:nok
				end
				ok == :ok
			end)
			Logger.debug("Any got it? #{inspect msg}, #{inspect any}")
			if any do
				:ok
			else
				:nok
			end
		end
		{:reply, ok, state}
	end

	# Uses by default the basic channel implementation for all calls except send.
	def handle_call(any, from, state) do
		Channel.handle_call(any, from, state)
	end

end
