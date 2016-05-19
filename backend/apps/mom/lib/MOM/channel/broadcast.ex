require Logger

defmodule Serverboards.MOM.Channel.Broadcast do
  @moduledoc ~S"""
  Broadcast channel. All messages are sent to all clients.
  """
  use Serverboards.MOM.Channel.Base
  alias Serverboards.MOM.{Message, Channel}

  @doc ~S"""
  Send a message to a channel.

  Always returns :ok and it is asynchronous.

  The way to know if it was sucesfull is listen to the :invalid channel.

  ## Examples

  Depending on how succesful was the `send` it returns different values:

    iex> alias Serverboards.MOM.{Channel, Message}
    iex> {:ok, ch} = Channel.Broadcast.start_link
    iex> Channel.send(ch, %Message{})
    :ok
    iex> Channel.subscribe(ch, fn _ -> :ok end)
    iex> Channel.send(ch, %Message{})
    :ok
    iex> Channel.subscribe(ch, fn _ -> raise "To return :nok" end)
    iex> Channel.send(ch, %Message{})
    :ok

  """
  def send(channel, %Message{} = message, options) do
    GenServer.cast(channel.pid, {:send, message, options})
    :ok
  end

  @doc ~S"""
  Handles normal send of messages, including :deadletter and :invalid message
  management.
  """
  def handle_cast({:send, msg, []}, state) do
    if Enum.count(state.subscribers) == 0 and msg.error != :deadletter do
      Channel.send(:deadletter, %{msg | error: :deadletter})
      Logger.warn("Sending #{inspect msg} to :deadletter messages channel.")
    else
      for {_,f} <- state.subscribers do
        try do
          f.(msg)
        rescue
          e ->
            Channel.send(:invalid, %Message{ msg | error: {e, System.stacktrace()}} )
            Logger.error("Error sending #{inspect msg} to #{inspect f}. Sent to :invalid messages channel.")
            Logger.error("#{inspect e}\n#{Exception.format_stacktrace}")
          end
        end
    end
    {:noreply, state}
  end
end
