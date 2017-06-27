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

    {:ok, uuid } = Test.Client.call(client, "rules_v2.create", %{
        name: "Test Rule",
        description: "Description",
        rule: %{
          trigger: %{
            type: "trigger",
            trigger: "test.trigger",
            params: %{}
          },
          actions: %{
            type: "action",
            action: "serverboards.core.actions/notify",
            params: %{
              to: "@user",
              subject: "This is an action test",
              body: "This is the test body, with some data {{A.extra_data}}"
            }
          }
        }
      })
    Logger.debug("Created rule with uuid #{inspect uuid}")

    {:ok, rules} = Test.Client.call(client, "rules_v2.list", %{})

    Logger.debug("Rules #{inspect rules}")

  end
end
