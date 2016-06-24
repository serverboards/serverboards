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
      service: nil,
      trigger: %{
        trigger: "serverboards.test.auth/periodic.timer",
        params: %{ period: 0.5 }
      },
      actions: %{
        "tick" => %{
          action: "serverboards.test.auth/touchfile",
          params: %{
            filename: "/tmp/sbds-rule-test"
          }
        }
      }
    }

    File.rm("/tmp/sbds-rule-test")
    {:ok, rule} = Rules.Rule.start_link rule_description

    :timer.sleep 2000

    {:ok, _ } = File.stat("/tmp/sbds-rule-test")

    Rules.Rule.stop rule
    File.rm("/tmp/sbds-rule-test")
  end

  test "Rules DB" do
    alias Serverboards.Rules.Rule

    l = Rules.list
    assert Enum.count(l) >= 0

    uuid = UUID.uuid4
    rule = %Rules.Rule{
      serverboard: nil,
      is_active: false,
      service: nil,
      name: "Test rule",
      serverboard: "TEST",
      description: "Long data",
      trigger: %{
        trigger: "serverboards.test.auth/periodic.timer",
        params: %{
          period: "0.5"
        },
      },
      actions: %{
        "tick" => %{
          action: "serverboards.test.auth/touchfile",
          params: %{
            filename: "/tmp/sbds-rule-test"
          }
        }
      }
    }

    me = Test.User.system

    # Some upserts
    Rule.upsert( uuid, rule, me )
    Rule.upsert( uuid, rule, me )

    Rule.upsert( nil, rule, me )

    # More complex with serverboard and related service
    Serverboards.Serverboard.serverboard_add "TEST-RULES-1", %{}, me
    {:ok, service_uuid} = Serverboards.Service.service_add %{}, me

    Rule.upsert( nil, Map.merge(rule, %{ serverboard: "TEST-RULES-1" }), me )
    Rule.upsert( nil, Map.merge(rule, %{ service: service_uuid }), me )

    # The full list
    l = Rules.list
    l |> Enum.map(fn r ->
      Logger.debug("Rule: #{inspect rule}")
    end)
    assert Enum.count(l) >= 2

    # none should be running
    assert Rules.ps == []

    # update should start them
    Rule.upsert( uuid, Map.merge(rule, %{is_active: true}), me )
    assert Rules.ps == [uuid]
    Rule.upsert( uuid, Map.merge(rule, %{is_active: false}), me )
    assert Rules.ps == []

  end
end
