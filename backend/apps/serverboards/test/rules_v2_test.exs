require Logger

defmodule Serverboards.RuleV2Test do
  use ExUnit.Case
  # @moduletag :capture_log

  alias Serverboards.Rules.RulesV2

  setup do
    # Explicitly get a connection before each test
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(Serverboards.Repo)
    # Setting the shared mode must be done only after checkout
    Ecto.Adapters.SQL.Sandbox.mode(Serverboards.Repo, {:shared, self()})
  end

  test "Create rule v2" do
    {:ok, client} = Test.Client.start_link as: "dmoreno@serverboards.io"

    {:ok, "SBDS-TST15"} = Test.Client.call client, "project.create", [
      "SBDS-TST15",
      %{
        "name" => "Serverboards test",
        "tags" => []
      },
    ]
    {:ok, service_id} = Test.Client.call(client, "service.create", %{ name: "test", type: "serverboards.test.auth/server"})


    {:ok, uuid } = Test.Client.call(client, "rules_v2.create", %{
        name: "Test Rule",
        description: "Description",
        rule: %{
          trigger: %{
            id: "A",
            type: "trigger",
            trigger: "test.trigger",
            params: %{},
            service_id: service_id
          },
          actions: [%{
            id: "B",
            type: "action",
            action: "serverboards.core.actions/notify",
            params: %{
              to: "@user",
              subject: "This is an action test",
              body: "This is the test body, with some data {{A.extra_data}}"
            }
          }]
        }
      })
    Logger.debug("Created rule with uuid #{inspect uuid}")

    {:ok, rules} = Test.Client.call(client, "rules_v2.list", %{})
    Logger.debug("Rules all #{inspect rules}")
    assert Enum.count(rules) == 1

    {:ok, rules} = Test.Client.call(client, "rules_v2.list", %{project: "SBDS-TST15"})
    Logger.debug("Rules SBDS-TST15 0 #{inspect rules}")
    assert Enum.count(rules) == 0


    {:ok, _} = Test.Client.call(client, "rules_v2.update", [uuid, %{ project: "SBDS-TST15" }])
    {:ok, rules} = Test.Client.call(client, "rules_v2.list", %{project: "SBDS-TST15"})
    Logger.debug("Rules SBDS-TST15 1 #{inspect rules}")
    assert Enum.count(rules) == 1
    assert (List.first rules)["uuid"] == uuid

    # check 1 compat
    {:ok, rules_v1} = Test.Client.call(client, "rules.list", %{project: "SBDS-TST15"})
    Logger.debug("Rules v1 #{inspect rules_v1}")
    assert Enum.count(rules) == 1
    assert (List.first rules_v1)["service"] == service_id


    {:ok, _} = Test.Client.call(client, "rules_v2.delete", [uuid])
    {:ok, rules} = Test.Client.call(client, "rules_v2.list", %{project: "SBDS-TST15"})
    Logger.debug("Rules SBDS-TST15 d0 #{inspect rules}")
    assert Enum.count(rules) == 0

  end
end
