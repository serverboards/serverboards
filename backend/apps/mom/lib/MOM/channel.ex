require Logger

defprotocol Serverboards.MOM.Channel do
  @moduledoc ~S"""
  A channel of communication. Subscribers are functions that will be
  called when somebody sends a message.

  There are several error conditions:

   * If a function raises an exception it is sent to the `:invalid` channel,
   * if there are no subscriber to the channel, it is sent to `:deadletter` channel
   * if the function raises an EXIT it will be removed from the functions to call

  There are several types of channels: named, broadcast and point to point.
  Named channels are broadcast channels with a name as an atom, as :invalid.

  ## Examples

    iex> require Logger
    iex> alias Serverboards.MOM.{Message, Channel}
    iex> {:ok, ch} = Channel.Broadcast.start_link
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
    iex> Channel.send(:empty, %Message{}) # always returns ok
    iex> Channel.unsubscribe(:deadletter, id)
    :ok

  # Channel subscription

  In a broadcast channel the return value of the called function
  is discarded, but on other implementations may require `:ok`, `:nok` or `:empty`
  for further processing, so its good practive to return these values in your
  functions.

  Options:

  * `front:` (true|false) -- The subscriber is added at the front so it will be called first.
    Useful for tapping, for example. Default false.

  ## Examples

  A subscription normally calls a function when a message arrives

    iex> alias Serverboards.MOM.{Channel, Message}
    iex> require Logger
    iex> {:ok, ch} = Channel.Broadcast.start_link
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
    iex> {:ok, a} = Channel.Broadcast.start_link
    iex> {:ok, b} = Channel.Broadcast.start_link
    iex> Channel.subscribe(a, b)
    iex> Channel.subscribe(b, fn _ ->
    ...>    Logger.info("B called")
    ...>    end)
    iex> Channel.send(a, %Serverboards.MOM.Message{ id: 0, payload: "test"})
    :ok
  """

  def subscribe(channel, function, options \\ [])
  def unsubscribe(channel, id)
  def send(channel, message, options \\ [])
end


defimpl Serverboards.MOM.Channel, for: Any do
  def subscribe(channel, function, options \\ []) do
    channel.__struct__.subscribe(channel, function, options)
  end
  def unsubscribe(channel, id) do
    channel.__struct__.unsubscribe(channel, id)
  end
  def send(channel, msg, options \\ []) do
    channel.__struct__.send(channel, msg, options)
  end
end

defmodule Serverboards.MOM.Channel.Base do
  @moduledoc ~S"""
  Default implementation of channel protocol as a GenServer.

  An implementation may be as simple as:
  ```
    defmodule MyChannel do
      using Serverboards.MOM.Channel.Base

      def send(channel, msg) do
        # ...
      end
    end
  ```

  init, subscribe and unsubscribe are base implemented. Default channels
  are GenServer s.

  Check Channel.Broadcast for a complete implementation.
  """

  defmacro __using__(_opts) do
    quote do
      # manual derive Channel
      @derive Serverboards.MOM.Channel

      defstruct [:pid]
      use GenServer

      @doc ~S"""
      Starts the link
      """
      def start_link do
        {:ok, pid} = GenServer.start_link(__MODULE__, :ok, [])
        {:ok, %{ __struct__: __MODULE__, pid: pid } }
      end

      @doc ~S"""
      Subscribes to a channel.
      """
      def subscribe(channel, subscriber, options) when is_function(subscriber) do
        #Logger.debug("Subscribe #{inspect channel} executes #{inspect subscriber}")
        GenServer.call(channel.pid, {:subscribe, subscriber, options})
      end
      def subscribe(orig, dest, options) do
        Logger.debug("Subscribe #{inspect orig} send to #{inspect dest}")
        subscribe(orig, &Serverboards.MOM.Channel.send(dest, &1), options)
      end


      @doc "Unsubscribes to a channel"
      def unsubscribe(channel, subscriber) do
        GenServer.call(channel.pid, {:unsubscribe, subscriber})
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

        {:reply, state.maxid,  %{ state |
            subscribers: subscribers,
            maxid: state.maxid+1
          }  }
      end

      def handle_call({:unsubscribe, s}, _, state) do
        {:reply, :ok, %{ state |
          subscribers: Enum.filter(state.subscribers, fn {id, _ } -> id != s end)
        }}
      end

      defoverridable [init: 1, subscribe: 3, unsubscribe: 2, start_link: 0]
    end
  end
end
