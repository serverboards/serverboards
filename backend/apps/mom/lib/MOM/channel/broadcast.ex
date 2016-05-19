require Logger

defmodule Serverboards.MOM.Channel.Broadcast do
  @moduledoc ~S"""
  Broadcast channel. All messages are sent to all clients.
  """
  use Serverboards.MOM.Channel.Base
  alias Serverboards.MOM.{Message, Channel}

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
    iex> {:ok, ch} = Channel.Broadcast.start_link
    iex> Channel.send(ch, %Message{})
    :empty
    iex> Channel.subscribe(ch, fn _ -> :ok end)
    iex> Channel.send(ch, %Message{})
    :ok
    iex> Channel.subscribe(ch, fn _ -> raise "To return :nok" end)
    iex> Channel.send(ch, %Message{})
    :nok

  """
  def send(channel, %Message{} = message, options) do
    GenServer.call(channel.pid, {:send, message, options})
  end

  @doc ~S"""
  Handles normal send of messages, including :deadletter and :invalid message
  management.
  """
  def handle_call({:send, msg, []}, _, state) do
    ok = if Enum.count(state.subscribers) == 0 and msg.error != :deadletter do
      Channel.send(:deadletter, %{msg | error: :deadletter})
      Logger.warn("Sending #{inspect msg} to :deadletter messages channel.")
      :empty
    else
      oks = for {_,f} <- state.subscribers do
        try do
          f.(msg)
          :ok
        rescue
          e ->
            Channel.send(:invalid, %Message{ msg | error: {e, System.stacktrace()}} )
            Logger.error("Error sending #{inspect msg} to #{inspect f}. Sent to :invalid messages channel.")
            Logger.error("#{inspect e}\n#{Exception.format_stacktrace}")
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
end
