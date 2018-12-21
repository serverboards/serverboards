require Logger

defmodule EventsourcingDatabaseTest do
  use ExUnit.Case

  test "Store into database" do
    import Supervisor.Spec
    {:ok, _pid} = Eventsourcing.Repo.start_link()

    {:ok, es} = EventSourcing.start_link()
    {:ok, items} = Agent.start_link(fn -> %{} end)

    EventSourcing.subscribe(
      es,
      fn :add_item, item, _author ->
        Agent.update(items, fn st ->
          Map.update(st, item, 1, &(&1 + 1))
        end)
      end,
      name: :add_item
    )

    EventSourcing.subscribe(
      es,
      fn :remove_item, item, _author ->
        Agent.update(items, fn st ->
          Map.update(st, item, 0, fn count ->
            if count > 0 do
              count - 1
            else
              0
            end
          end)
        end)
      end,
      name: :remove_item
    )

    EventSourcing.Model.subscribe(es, :cart, Eventsourcing.Repo)

    EventSourcing.dispatch(es, :add_item, :milk, "dmoreno@serverboards.io")
    EventSourcing.dispatch(es, :add_item, :milk, "dmoreno@serverboards.io")
    EventSourcing.dispatch(es, :add_item, :cookies, "dmoreno@serverboards.io")
    EventSourcing.dispatch(es, :remove_item, :milk, "dmoreno@serverboards.io")
    EventSourcing.dispatch(es, :add_item, :milk, "dmoreno@serverboards.io")

    cart = Agent.get(items, & &1)
    assert cart.milk == 2
    assert cart.cookies == 1

    res = Eventsourcing.Repo.all(EventSourcing.Model.EventStream)
    Logger.info("Get all: #{inspect(res)}")
  end
end
