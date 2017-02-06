require Logger

defmodule Serverboards.ProcessRegistryTest do
  use ExUnit.Case
  @moduletag :capture_log

  :ok = Application.ensure_started(:serverboards)

  test "Start, register, deregister" do
    {:ok, registry} = Serverboards.ProcessRegistry.start_link()

    assert :ok == Serverboards.ProcessRegistry.add(registry, 1, self())
    assert Serverboards.ProcessRegistry.get(registry, 1) == self()

    assert Serverboards.ProcessRegistry.pop(registry, 1) == self()

    Serverboards.ProcessRegistry.stop(registry)
  end

  test "Start, kill, check" do
    {:ok, registry} = Serverboards.ProcessRegistry.start_link
    {:ok, agent} = Agent.start_link(fn -> {} end)

    :ok = Serverboards.ProcessRegistry.add(registry, 1, agent)
    assert Serverboards.ProcessRegistry.get(registry, 1) == agent
    Agent.stop(agent)
    :timer.sleep(300)

    assert Serverboards.ProcessRegistry.get(registry, 1) == nil
  end

end
