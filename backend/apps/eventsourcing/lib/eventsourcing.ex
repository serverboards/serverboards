require Logger

defmodule EventSourcing do
  @moduledoc ~S"""
  Implements very basic event sourcinf system

  It can subscribe to events and dispatch such events.

  For an introduction see
    * http://martinfowler.com/eaaDev/EventSourcing.html
    * https://en.wikipedia.org/wiki/Command%E2%80%93query_separation

  ## Advantages

  * Reproducability
  * Accountability
  * Change of requirements, modify state based on actions

  ## Diferences with Redux JS actions/reducers
  Redux has a very similar baheviour, but it is intended as actions and reducers.

  The actions in redux are intended to crete some side effect, and return a
  redux action/event. This event then is processed by all the reducers to
  reduce to a system status. In this way it is very funtional, as purely,
  if not used for the action side effects, it synthetises a status.

  On the other hand the EventSourcing does no action in the dispatch, it just
  adds it to the event queue. And it is the subscriber that does the action.

  In this sense Redux can time travel and the status will be changing as
  required, as the side effects are done before getting into redux. Event
  sourcing on the other hand do all the side effects inside the eventsourcing,
  so that time travelling is only possible between checkpoints, which have a known
  previous state and then apply all subsequent events. This may very well be
  the begining.

  ## Differences with Message Channels
  In essence they do almost the same, some event in a channel and actions on
  such event. And Event Sourcing can be implemented in terms of channels,
  but this implementation decided to do the miminal, to avoid overhead, and
  as implementation can be tailored specifically for this task.

  Also EventSourcing has easy ways to store events (for exmaple in a database)
  as they ocur, so that they can be replayed later to generate again the
  final status.

  ## Example

    iex> {:ok, es} = start_link
    iex> {:ok, counter} = Agent.start_link fn -> 0 end
    iex> inc = defevent es, :inc, fn [], _author -> Agent.update counter, &(&1 + 1) end
    iex> dec = defevent es, :dec, fn [], _author -> Agent.update counter, &(&1 - 1) end
    iex> inc.([],"me")
    iex> inc.([],"me")
    iex> inc.([],"me")
    iex> dec.([],"me")
    iex> Agent.get counter, &(&1)
    2

  """
  use GenServer

  def start_link(options\\[]) do
    GenServer.start_link __MODULE__, :ok, options
  end

  @doc ~S"""
  Subscribes the given event with the given data.

  Returns a map of named dispatchers results.

  This map is usefull to avoid round trips to get data after a change, for
  example return the status of a database record.

  Options:

  * except: Will be delivered to subscribers that do not have this option set,
            for example, except: :store, will not send it to subscribers with
            store: true.

  """
  def dispatch(pid, type, data, author, options \\ []) do
    GenServer.call(pid, {:dispatch, type, data, author, options})
  end

  @doc ~S"""
  Subscribes the event sourcer.

  It has several options:

    * special_subscriber
    * function
    * function, options
    * :type, function, options

  Function receives the type, data and author, or just data and author if
  type is preset.

  Special subscribers:
   * :debug -- Show the events and type as done
   * :debug_full -- Show also the data

  """
  def subscribe(pid, :debug) do
    subscribe(pid, fn type, _data, author ->
      Logger.debug("Event #{author}: #{type}")
    end, name: :debug)
  end
  def subscribe(pid, :debug_full) do
    subscribe(pid, fn type, data, author ->
      Logger.debug("Event #{author}: #{type}(#{inspect data})")
    end, name: :debug_full)
  end
  def subscribe(pid, reducer), do: subscribe(pid, reducer, [])

  def subscribe(pid, reducer, options) when is_function(reducer) do
    GenServer.call(pid, {:subscribe, reducer, options})
  end
  def subscribe(pid, type, reducer, options \\ []) when is_atom(type) and is_function(reducer) do
    GenServer.call(pid, {:subscribe, reducer, options ++ [type: type]})
  end

  def replay(pid, list_of_events) do
    GenServer.call(pid, {:replay, list_of_events})
  end

  @doc ~S"""
  Defines an event with an optional default implementation and options.

  Returns a callable that will emit this event, calling the function as a
  subscribed event.

  The options are for both the dispatching (:except) and the event (:name).

  This is just a shortcut function.
  """
  def defevent(pid, type, reducer \\ nil, options \\ []) do
    if reducer do
      GenServer.call(pid, {:subscribe, reducer, options ++ [type: type]})
    end
    # return a caller
    fn
      args, author ->
        EventSourcing.dispatch(pid, type, args, author, options)
    end
  end

  ## server impl
  def init(:ok) do
    {:ok, %{
      reducers: []
    } }
  end

  # Dispatch to one reducer, checking if has any type, and errors.
  defp dispatch_one(type, data, author, reducer, options) do
    res = try do
      case Keyword.get(options, :type, :any) do
        :any ->
          #Logger.debug("  Call reducer #{Keyword.get options, :name, :unknown}")
          reducer.(type, data, author)
        ^type ->
          #Logger.debug("  Call reducer #{Keyword.get options, :name, :unknown}")
          reducer.(data, author)
        _ ->
          nil
      end
    rescue
      e in FunctionClauseError ->
        # Some voodoo to check it it was us with a wrong action type, if so ignore
        stacktrace = System.stacktrace
        #Logger.debug("Error processing reducer #{Keyword.get options, :name, :unkonwn}\n#{inspect e}\n#{Exception.format_stacktrace}")
        case (hd (tl stacktrace)) do
          {EventSourcing, _, _, _} ->
            nil
          _ ->
            reraise e, stacktrace
        end
    end
  end

  defp dispatchp(reducers, type, data, author, event_options) do
    #Logger.debug("Dispatch #{type}")
    Enum.reduce reducers, %{}, fn {reducer, options}, acc ->
      # Will skip if any of the except elements is at options as true
      skip = Enum.any? List.wrap(Keyword.get(event_options, :except,[])), fn k ->
        Keyword.get(options, k, false)
      end

      if skip do
        Logger.debug("Skipping event sourcing #{Keyword.get(options, :name)}")
        acc
      else
        # Do the reducer and keep result.
        res = dispatch_one(type, data, author, reducer, options)
        # Set it into the return map, or not.
        case {res, Keyword.get(options, :name)} do
          {nil, _ }   -> acc
          {res, name} -> Map.put(acc, name, res)
          _           -> acc
        end
      end
    end
  end

  def handle_call({:dispatch, type, data, author, options}, from, status) do
    # Do it in a new task, allow reentry and leaves this channel ready for more.
    # Should not do race conditions as individually each call has to be
    # answered before flow continues on caller    
    Task.start_link fn ->
      res=dispatchp(status.reducers, type, data, author, options)
      GenServer.reply(from, res)
    end
    {:noreply, status}
  end

  def handle_call({:subscribe, reducer, options}, from, status) do
    {:reply, :ok, %{ status |
      reducers: status.reducers ++ [{reducer, options}]
    } }
  end

  def handle_call({:replay, list_of_events}, from, status) do
    ret = Enum.map( list_of_events, fn {type, data, author} -> dispatchp(status.reducers, type, data, author, []) end)
    {:reply, ret, status}
  end
end
