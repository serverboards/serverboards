require Logger

defmodule EventsourcingTest do
  use ExUnit.Case
  doctest EventSourcing, import: true

  test "Create a eventsourcing server, and use it to log actions" do

    {:ok, es} = EventSourcing.start_link
    {:ok, items} = Agent.start_link fn -> %{} end
    {:ok, logger} = Agent.start_link fn -> [] end

    EventSourcing.subscribe es, fn type, data, author ->
      Agent.update logger, fn st -> st ++ [{type, data, author}] end
    end, name: :history
    EventSourcing.subscribe es, fn type, data, _author ->
      Logger.info("New event: #{inspect type}, status #{inspect Agent.get(items, &(&1))}")
    end, name: :logger, priority: 1000


    EventSourcing.subscribe es, fn :add_item, item, _author ->
      Agent.update items, fn st ->
        Map.update(st, item, 1, &( &1 + 1 ) )
      end
    end, name: :add_item

    EventSourcing.subscribe es, fn :remove_item, item, _author ->
      Agent.update items, fn st ->
        Map.update(st, item, 0, fn count ->
          if count > 0 do
            count - 1
          else
            0
          end
        end)
      end
    end, name: :remove_item

    EventSourcing.dispatch(es, :add_item, :milk, "me")
    EventSourcing.dispatch(es, :add_item, :milk, "me")
    EventSourcing.dispatch(es, :add_item, :cookies, "me")
    EventSourcing.dispatch(es, :remove_item, :milk, "me")
    EventSourcing.dispatch(es, :add_item, :milk, "me")

    cart = Agent.get items, &(&1)
    assert cart.milk == 2
    assert cart.cookies == 1

    # Now with the recorded events, do something diferent
    {:ok, es2} = EventSourcing.start_link
    {:ok, items2} = Agent.start_link fn -> %{} end
    EventSourcing.subscribe es2, fn
      :add_item, item, _author ->
        Agent.update items2, fn st ->
          Map.update(st, item, 1, &( &1 + 1 ) )
        end
      :remove_item, item, _author ->
       Agent.update items2, fn st ->
         Map.update(st, item, 0, fn count ->
           if count > 0 do
             count - 1
           else
             0
           end
         end)
       end
     end, name: :add_remove_in_one

     EventSourcing.replay( es2, Agent.get(logger, &(&1)) )
     assert (Agent.get items, &(&1)) == (Agent.get items2, &(&1))
  end


  test "Higher level API" do
    {:ok, es} = EventSourcing.start_link
    {:ok, items} = Agent.start_link fn -> %{} end

    EventSourcing.subscribe es, :debug

    # it defines an event and an initial implementation. Can be redefined.
    # when called it dispatchs the event, does not call the implementation
    add_item = EventSourcing.defevent es, :add_item, fn item, _author ->
      Agent.update items, fn st ->
        Map.update(st, item, 1, &( &1 + 1 ) )
      end
    end
    remove_item = EventSourcing.defevent es, :remove_item, fn item, _author ->
      Agent.update items, fn st ->
        Map.update(st, item, 0, fn count ->
          if count > 0 do
            count - 1
          else
            0
          end
        end)
      end
    end

    add_item.(:milk, "me")
    add_item.(:milk, "me")
    add_item.(:cookies, "me")
    add_item.(:milk, "me")
    remove_item.(:milk, "me")
    add_item.(:milk, "me")

  end

  test "Reducers can return result" do
    {:ok, es} = EventSourcing.start_link
    {:ok, items} = Agent.start_link fn -> %{} end

    EventSourcing.subscribe es, :debug_full

    add_item = EventSourcing.defevent es, :add_item, fn item, _author ->
      cart = Agent.get_and_update items, fn st ->
        st=Map.update(st, item, 1, &( &1 + 1 ) )
        {st, st}
      end
      cart
    end, name: :status

    assert Map.get(add_item.(:milk, "me"), :status) == %{ milk: 1 }
    assert Map.get(add_item.(:milk, "me"), :status) == %{ milk: 2 }

  end
end
