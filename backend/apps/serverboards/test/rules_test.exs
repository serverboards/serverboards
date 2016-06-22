require Serverboards.Logger
alias Serverboards.Logger

defmodule Serverboards.TriggersTest do
  use ExUnit.Case
  #@moduletag :capture_log

  alias Serverboards.Rules.Trigger

  test "Trigger catalog" do
    triggers = Trigger.find
    assert Enum.count(triggers) >= 1
    Logger.info(inspect triggers)
    [r | _] = triggers
    assert r.states == ["tick","stop"]
  end

  test "Run trigger" do
    [r] = Trigger.find id: "serverboards.test.auth/periodic.timer"

    {:ok, last_trigger} = Agent.start_link fn -> :none end

    {:ok, id} = Trigger.start r, %{ period: 1 }, fn params ->
      Logger.debug("Trigered event: #{inspect params}")
      Agent.update last_trigger, fn _ -> :triggered end
    end

    :timer.sleep(2000)
    Trigger.stop id

    assert Agent.get(last_trigger, &(&1)) == :triggered
  end
end
