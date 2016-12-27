require Logger

defmodule Serverboards.TriggersTest do
  use ExUnit.Case
  @moduletag :capture_log

  alias Serverboards.Rules.Trigger
  alias Serverboards.Rules

  setup do
    # Explicitly get a connection before each test
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(Serverboards.Repo)
    # Setting the shared mode must be done only after checkout
    Ecto.Adapters.SQL.Sandbox.mode(Serverboards.Repo, {:shared, self()})
  end

  def rule(tomerge \\ %{}) do
    Map.merge(
      %Rules.Rule{
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
      }, tomerge
      )
  end

  test "Trigger catalog" do
    triggers = Trigger.find
    assert Enum.count(triggers) >= 1
    Logger.info(inspect triggers)
    [r | _] = triggers
    assert r.states == ["tick","stop"]
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
      },
      last_state: nil
    }

    File.rm("/tmp/sbds-rule-test")
    {:ok, rule} = Rules.Rule.start_link rule_description

    :timer.sleep 1500

    {:ok, _ } = File.stat("/tmp/sbds-rule-test")

    Rules.Rule.stop rule_description.uuid
    File.rm("/tmp/sbds-rule-test")
  end

  test "Service config overwrites trigger and actions params" do
    # same as above, but config in service
    {:ok, service_uuid} = Serverboards.Service.service_add(
      %{
        "name" => "Test service for config",
        "type" => "xx",
        "config" => %{
          filename: "/tmp/sbds-rule-test",
          period: 0.5
        }
      }, Test.User.system )
    # ensure is created
    :timer.sleep(500)
    Logger.debug("Created service #{service_uuid}")

    rule_description = %{
      uuid: UUID.uuid4,
      service: service_uuid,
      trigger: %{
        trigger: "serverboards.test.auth/periodic.timer",
        params: %{
          period: 100000,
        }
      },
      actions: %{
        "tick" => %{
          action: "serverboards.test.auth/touchfile",
          params: %{
            filename: nil,
          }
        }
      },
      last_state: nil
    }




    File.rm("/tmp/sbds-rule-test")
    {:ok, _} = Rules.Rule.start_link rule_description

    :timer.sleep 1500

    {:ok, _ } = File.stat("/tmp/sbds-rule-test")

    Rules.Rule.stop rule.uuid
    File.rm("/tmp/sbds-rule-test")
  end

  test "Rules DB" do
    l = Rules.list
    assert Enum.count(l) >= 0

    uuid = UUID.uuid4

    me = Test.User.system

    # Some upserts
    Rules.upsert( Map.put(rule, :uuid, uuid), me )
    Rules.upsert( Map.put(rule, :uuid, uuid), me )

    Rules.upsert( rule, me )

    # More complex with serverboard and related service
    Serverboards.Serverboard.serverboard_add "TEST-RULES-1", %{}, me
    {:ok, service_uuid} = Serverboards.Service.service_add %{}, me

    Rules.upsert( Map.merge(rule, %{ serverboard: "TEST-RULES-1" }), me )
    Rules.upsert( Map.merge(rule, %{ service: service_uuid }), me )

    # The full list
    l = Rules.list
    l |> Enum.map(fn r ->
      Logger.debug("Rule: #{inspect rule}")
    end)
    assert Enum.count(l) >= 2

    # none should be running
    assert Rules.ps == []

    # update should start them
    Rules.upsert( Map.merge(rule, %{uuid: uuid, is_active: true}), me )
    assert Rules.ps == [uuid]
    Rules.upsert( Map.merge(rule, %{uuid: uuid, is_active: false}), me )
    assert Rules.ps == []

    assert Rules.decorate(uuid) != nil
  end

  test "Basic RPC" do
    {:ok, client} = Test.Client.start_link as: "dmoreno@serverboards.io"

    {:ok, l} = Test.Client.call(client, "rules.list", [])
    {:ok, []} = Test.Client.call(client, "rules.list", [uuid: UUID.uuid4 ])

    {:ok, :ok} = Test.Client.call(client, "rules.update", rule)

    :timer.sleep(500)
    {:ok, l} = Test.Client.call(client, "rules.list", [])
    Logger.info(inspect l)
  end

  test "Enable, Disable, Enable rule" do
    alias Serverboards.Rules.Rule
    uuid = UUID.uuid4
    me = Test.User.system

    File.rm("/tmp/sbds-rule-test")
    Rules.upsert( rule(%{ uuid: uuid, is_active: true }), me )
    :timer.sleep(1000)
    Logger.info("Should have triggered")
    {:ok, _ } = File.stat("/tmp/sbds-rule-test")

    Logger.info("UPDATE")
    Rules.upsert( rule(%{ uuid: uuid, is_active: false }), me )
    :timer.sleep(1000)
    File.rm("/tmp/sbds-rule-test")
    :timer.sleep(1000)
    Logger.info("Should NOT have triggered")
    {:error, _ } = File.stat("/tmp/sbds-rule-test")

    File.rm("/tmp/sbds-rule-test")
    Rules.upsert( rule(%{ uuid: uuid, is_active: true }), me )
    :timer.sleep(1000)
    Logger.info("Should have triggered")
    {:ok, _ } = File.stat("/tmp/sbds-rule-test")

    Rules.upsert( rule(%{ uuid: uuid, is_active: false }), me )
    :timer.sleep(1000)
    File.rm("/tmp/sbds-rule-test")
    :timer.sleep(1000)
    Logger.info("Should NOT have triggered")
    {:error, _ } = File.stat("/tmp/sbds-rule-test")

  end

  test "Modify rule restarts it" do
    alias Serverboards.Rules.Rule
    uuid = UUID.uuid4
    me = Test.User.system

    File.rm("/tmp/sbds-rule-test")
    Rules.upsert( rule(%{ uuid: uuid, is_active: true }), me )
    :timer.sleep(1000)
    Logger.info("Should have triggered")
    {:ok, _ } = File.stat("/tmp/sbds-rule-test")

    [rule] = Rules.list( uuid: uuid )
    assert rule.last_state == "tick"

    # now with just 100 ms
    File.rm("/tmp/sbds-rule-test")
    Rules.upsert( rule(%{
      uuid: uuid,
      is_active: true,
      trigger: %{
        trigger: "serverboards.test.auth/periodic.timer",
        params: %{
          period: "0.1"
        },
      } } ), me )

    :timer.sleep(300)
    Logger.info("Should have triggered")
    {:ok, _ } = File.stat("/tmp/sbds-rule-test")

    Rules.upsert( rule(%{
      uuid: uuid,
      is_active: false
      } ), me )
    :timer.sleep(300)

  end

  test "Fail rule start / Exception" do
    alias Serverboards.Rules.Rule
    me = Test.User.system
    uuid = UUID.uuid4

    assert (Process.whereis Serverboards.Rules) != nil

    Rules.upsert( rule(%{
      uuid: uuid,
      trigger: %{
        trigger: "serverboards.test.auth/except.trigger",
        params: %{ }
        },
      is_active: true
      }), me )
    :timer.sleep(300)

    assert (Process.whereis Serverboards.Rules) != nil
    [rule] = Rules.list uuid: uuid
    assert rule.is_active == false
  end

  test "Abort rule start / Exception" do
    alias Serverboards.Rules.Rule
    me = Test.User.system
    uuid = UUID.uuid4

    assert (Process.whereis Serverboards.Rules) != nil

    Rules.upsert( rule(%{
      uuid: uuid,
      trigger: %{
        trigger: "serverboards.test.auth/abort.trigger",
        params: %{ }
        },
      is_active: true
      }), me )
    :timer.sleep(300)

    assert (Process.whereis Serverboards.Rules) != nil
    [rule] = Rules.list uuid: uuid
    assert rule.is_active == false
  end

  test "No fail start non existant trigger" do
    alias Serverboards.Rules.Rule
    me = Test.User.system
    uuid = UUID.uuid4

    assert (Process.whereis Serverboards.Rules) != nil

    Rules.upsert( rule(%{
      uuid: uuid,
      trigger: %{
        trigger: "serverboards.test.auth/does.not.exist",
        params: %{ }
        },
      is_active: true
      }), me )
    :timer.sleep(300)

    assert (Process.whereis Serverboards.Rules) != nil
    [rule] = Rules.list uuid: uuid
    assert rule.is_active == false
  end
end
