require Serverboards.Logger
alias Serverboards.Logger

defmodule Serverboards.TriggersTest do
  use ExUnit.Case
  #@moduletag :capture_log

  alias Serverboards.Rules.Trigger
  alias Serverboards.Rules

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

    {:ok, id} = Trigger.start r, %{ period: 0.1 }, fn params ->
      Logger.debug("Triggered event: #{inspect params}")
      Agent.update last_trigger, fn _ -> :triggered end
    end

    :timer.sleep(300)
    Trigger.stop id

    assert Agent.get(last_trigger, &(&1)) == :triggered
  end

  test "Manual rule" do
    rule_description = %{
      uuid: UUID.uuid4,
      trigger: %{
        service: nil,
        id: "serverboards.test.auth/periodic.timer",
        params: %{ period: 0.5 }
      },
      actions: %{
        "tick" => %{
          id: "serverboards.test.auth/touchfile",
          params: %{
            filename: "/tmp/sbds-rule-test"
          }
        }
      }
    }

    File.rm("/tmp/sbds-rule-test")
    {:ok, rule} = Rules.start_link rule_description

    :timer.sleep 2000

    {:ok, _ } = File.stat("/tmp/sbds-rule-test")

    Rules.stop rule
    File.rm("/tmp/sbds-rule-test")
  end
end
