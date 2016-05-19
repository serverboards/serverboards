require Logger

defmodule MOM.Channel.Broadcast do
  @moduledoc ~S"""
  Broadcast channel. All messages are sent to all clients.
  """
  use MOM.Channel.Base
  alias MOM.{Message, Channel}

  @doc ~S"""
  Send a message to a channel.

  Always returns :ok and it is asynchronous.

  The way to know if it was sucesfull is listen to the :invalid channel.

  ## Options

  * sync -- Default false. Wait untill all messages processed.

  ## Examples

  Depending on how succesful was the `send` it returns different values:

    iex> alias MOM.{Channel, Message}
    iex> {:ok, ch} = Channel.Broadcast.start_link
    iex> Channel.send(ch, %Message{})
    :ok
    iex> Channel.subscribe(ch, fn _ -> :ok end)
    iex> Channel.send(ch, %Message{})
    :ok
    iex> Channel.subscribe(ch, fn _ -> raise "To return :nok" end)
    iex> Channel.send(ch, %Message{}, sync: true)
    :ok

  """
  def send(channel, %Message{} = message, options) do
    if Keyword.get(options, :sync, false) do
      GenServer.call(channel.pid, {:send, message, options})
    else
      GenServer.cast(channel.pid, {:send, message, options})
    end
    :ok
  end

  defp dispatch(state, msg, _options) do
    subscribers = if Enum.count(state.subscribers) == 0 and msg.error != :deadletter do
      Channel.send(:deadletter, %{msg | error: :deadletter})
      Logger.warn("Sending #{inspect msg} to :deadletter messages channel.")
      state.subscribers
    else
      subscribers = for {options,f} <- state.subscribers do
        try do
          f.(msg)
          {options, f}
        catch
          :exit, _ ->
            Logger.warn("Sending #{inspect msg} to exitted process. Removing it.")
            nil
        rescue
          e ->
            Channel.send(:invalid, %Message{ msg | error: {e, System.stacktrace()}} )
            Logger.error("Error sending #{inspect msg} to #{inspect f}. Sent to :invalid messages channel.")
            Logger.error("#{inspect e}\n#{Exception.format_stacktrace}")
            {options, f}
        end
      end
      Enum.filter(subscribers, &(&1 != nil))
    end
    %{ state | subscribers: subscribers }
  end

  @doc ~S"""
  Handles normal send of messages, including :deadletter and :invalid message
  management.
  """
  def handle_cast({:send, msg, options}, state) do
    state = dispatch(state, msg, options)
    {:noreply, state}
  end
  @doc ~S"""
  Handles sync send of messages, including :deadletter and :invalid message
  management.

  In some situations sowrk should not continue until the message has been
  delivered to all points, for example at authentication, where following
  work may require this message to have been processed.
  """
  def handle_call({:send, msg, options}, _from, state) do
    state = dispatch(state, msg, options)
    {:reply, :ok, state}
  end
end
