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
    iex> inc = defevent es, :inc, fn [] -> Agent.update counter, &(&1 + 1) end
    iex> dec = defevent es, :dec, fn [] -> Agent.update counter, &(&1 - 1) end
    iex> inc.([])
    iex> inc.([])
    iex> inc.([])
    iex> dec.([])
    iex> Agent.get counter, &(&1)
    2

  """
  use GenServer

  def start_link(options\\[]) do
    GenServer.start_link __MODULE__, :ok, options
  end

  def dispatch(pid, type, data) do
    GenServer.call(pid, {:dispatch, type, data})
  end

  def subscribe(pid, reducer, options \\ []) do
    GenServer.call(pid, {:subscribe, reducer, options})
  end

  def replay(pid, list_of_events) do
    GenServer.call(pid, {:replay, list_of_events})
  end

  def defevent(pid, type, reducer, options \\ []) do
    GenServer.call(pid, {:subscribe, fn ^type, args -> reducer.(args) end, options})
    # return a caller
    fn
      args ->
        EventSourcing.dispatch(pid, type, args)
    end
  end

  ## server impl
  def init(:ok) do
    {:ok, %{
      reducers: []
    } }
  end

  defp dispatchp(reducers, type, data) do
    for {reducer, _options} <- reducers do
      try do
        reducer.(type, data)
      rescue
        e in FunctionClauseError ->
          # Some voodoo to check it it was us with a wrong action type, if so ignore
          stacktrace = System.stacktrace
          case (hd (tl stacktrace)) do
            {EventSourcing, _, _, _} ->
              nil
            _ ->
              reraise e, stacktrace
          end
      end
    end
  end

  def handle_call({:dispatch, type, data}, _from, status) do
    {:reply, dispatchp(status.reducers, type, data), status}
  end

  def handle_call({:subscribe, reducer, options}, from, status) do
    {:reply, :ok, %{ status |
      reducers: status.reducers ++ [{reducer, options}]
    } }
  end

  def handle_call({:replay, list_of_events}, from, status) do
    ret = Enum.map( list_of_events, fn {type, data} -> dispatchp(status.reducers, type, data) end)
    {:reply, ret, status}
  end
end
