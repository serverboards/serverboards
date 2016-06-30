require Logger

defmodule EventSourcing.FailTest do
  use ExUnit.Case
  test "Dispatcher restarts, life continues" do
    {:ok, _sup} = Supervisor.start_link([
      Supervisor.Spec.worker(
        Agent,
          [fn ->
            Logger.info("Start agent")
            %{}
          end, [name: :fail_test_agent]
          ], [
            restart: :permanent
          ]),
      Supervisor.Spec.worker(
        EventSourcing,
        [ [name: :fail_test_eventsourcing] ], [
          restart: :permanent
        ] )
      ], strategy: :one_for_one)

    es = :fail_test_eventsourcing
    agent = :fail_test_agent
    EventSourcing.subscribe es, :store, fn {k, v}, _me ->
      Agent.update agent, fn st -> Map.put(st, k, v) end
    end
    EventSourcing.subscribe es, :killme, fn _, _me ->
      Process.exit self, :kill
    end

    EventSourcing.dispatch es, :store, {:key, :value}, nil

    assert Agent.get(agent, fn st -> Map.get(st, :key) end) == :value

    # Kill the agent doing something wrong. Supervisor should resurrect it
    Agent.stop agent, :kill
    :timer.sleep 100

    assert Agent.get(agent, fn st -> Map.get(st, :key) end) == nil

    # Now kill the es!
    EventSourcing.dispatch es, :killme, nil, nil
    :timer.sleep 100

    # and call
    EventSourcing.dispatch es, :store, {:key, :value}, nil
    # and get
    assert Agent.get(agent, fn st -> Map.get(st, :key) end) == :value
  end
end
