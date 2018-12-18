require Logger

defmodule Serverboards.RuleV2Test do
  use ExUnit.Case
  @moduletag :capture_log

  setup do
    # Explicitly get a connection before each test
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(Serverboards.Repo)
    # Setting the shared mode must be done only after checkout
    Ecto.Adapters.SQL.Sandbox.mode(Serverboards.Repo, {:shared, self()})

    :ok
  end

  test "Create rule v2" do
    {:ok, client} = Test.Client.start_link(as: "dmoreno@serverboards.io")

    {:ok, "SBDS-TST15"} =
      Test.Client.call(client, "project.create", [
        "SBDS-TST15",
        %{
          "name" => "Serverboards test",
          "tags" => []
        }
      ])

    {:ok, service_id} =
      Test.Client.call(client, "service.create", %{
        name: "test",
        type: "serverboards.test.auth/server"
      })

    {:ok, uuid} =
      Test.Client.call(client, "rules_v2.create", %{
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
          actions: [
            %{
              id: "B",
              type: "action",
              action: "serverboards.core.actions/notify",
              params: %{
                to: "@user",
                subject: "This is an action test",
                body: "This is the test body, with some data {{A.extra_data}}"
              }
            }
          ]
        }
      })

    Logger.debug("Created rule with uuid #{inspect(uuid)}")

    {:ok, rules} = Test.Client.call(client, "rules_v2.list", %{})
    Logger.debug("Rules all #{inspect(rules)}")
    assert Enum.count(rules) == 1

    {:ok, rules} = Test.Client.call(client, "rules_v2.list", %{project: "SBDS-TST15"})
    Logger.debug("Rules SBDS-TST15 0 #{inspect(rules)}")
    assert Enum.count(rules) == 0

    {:ok, _} = Test.Client.call(client, "rules_v2.update", [uuid, %{project: "SBDS-TST15"}])
    {:ok, rules} = Test.Client.call(client, "rules_v2.list", %{project: "SBDS-TST15"})
    Logger.debug("Rules SBDS-TST15 1 #{inspect(rules)}")
    assert Enum.count(rules) == 1
    assert List.first(rules)["uuid"] == uuid

    # check 1 compat
    {:ok, rules_v1} = Test.Client.call(client, "rules.list", %{project: "SBDS-TST15"})
    Logger.debug("Rules v1 #{inspect(rules_v1)}")
    assert Enum.count(rules) == 1
    assert List.first(rules_v1)["service"] == service_id

    {:ok, rule2} = Test.Client.call(client, "rules_v2.get", [uuid])
    assert rule2["uuid"] == uuid

    {:ok, _} = Test.Client.call(client, "rules_v2.delete", [uuid])
    {:ok, rules} = Test.Client.call(client, "rules_v2.list", %{project: "SBDS-TST15"})
    Logger.debug("Rules SBDS-TST15 d0 #{inspect(rules)}")
    assert Enum.count(rules) == 0
  end

  test "Simple rule run" do
    rule = %{
      uuid: UUID.uuid4(),
      from_template: nil,
      name: "test",
      description: "Test rule",
      rule: %{
        "when" => %{
          "type" => "trigger",
          "trigger" => "serverboards.test.auth/periodic.timer",
          "params" => %{
            "period" => "0.1"
          }
        },
        "actions" => [
          %{
            "type" => "action",
            "action" => "serverboards.test.auth/touchfile",
            "params" => %{
              "filename" => "/tmp/rule-v2.test"
            }
          },
          %{
            "type" => "action",
            "action" => "serverboards.test.auth/touchfile",
            "params" => %{
              "filename" => "/tmp/rule-v2-2.test"
            }
          }
        ]
      }
    }

    File.rm("/tmp/rule-v2.test")
    File.rm("/tmp/rule-v2-2.test")

    {:ok, _pid} = Serverboards.RulesV2.Rule.start_link(rule)

    :timer.sleep(1000)
    Logger.info("Running: #{inspect(Serverboards.Action.ps(1))}")

    {res1, _} = File.stat("/tmp/rule-v2.test")
    File.rm("/tmp/rule-v2.test")
    {res2, _} = File.stat("/tmp/rule-v2-2.test")
    File.rm("/tmp/rule-v2-2.test")

    assert res1 == :ok
    assert res2 == :ok

    Serverboards.RulesV2.Rule.stop(rule.uuid)
  end

  test "Rule with conditionals" do
    rule = %{
      uuid: UUID.uuid4(),
      name: "test",
      description: "Test rule",
      from_template: nil,
      rule: %{
        "when" => %{
          "type" => "trigger",
          "trigger" => "serverboards.test.auth/periodic.timer",
          "params" => %{
            "period" => "0.1",
            "tick" => "tick"
          }
        },
        "actions" => [
          %{
            "type" => "condition",
            "condition" => "A.tick == 'tick'",
            "then" => [
              %{
                "id" => "B",
                "type" => "action",
                "action" => "serverboards.test.auth/touchfile",
                "params" => %{
                  "filename" => "/tmp/rule-then.test"
                }
              }
            ],
            "else" => [
              %{
                "id" => "C",
                "type" => "action",
                "action" => "serverboards.test.auth/touchfile",
                "params" => %{
                  "filename" => "/tmp/rule-else.test"
                }
              }
            ]
          }
        ]
      }
    }

    File.rm("/tmp/rule-then.test")
    File.rm("/tmp/rule-else.test")

    {:ok, pid} = Serverboards.RulesV2.Rule.start_link(rule)
    :timer.sleep(1000)

    {res1, _} = File.stat("/tmp/rule-then.test")
    File.rm("/tmp/rule-v2.test")
    {res2, _} = File.stat("/tmp/rule-else.test")
    File.rm("/tmp/rule-v2-2.test")

    assert res1 == :ok
    assert res2 == :error

    Serverboards.RulesV2.Rule.stop(pid)
  end

  test "Add rule to db and start it" do
    {:ok, client} = Test.Client.start_link(as: "dmoreno@serverboards.io")

    # cleanup
    File.rm("/tmp/rule-v2-3.test")
    File.rm("/tmp/rule-v2-32.test")
    File.rm("/tmp/rule-v2-2.test")

    {:ok, uuid} =
      Test.Client.call(client, "rules_v2.create", %{
        name: "Rule test",
        description: "Long description of a rule to test",
        is_active: true,
        rule: %{
          "when" => %{
            "type" => "trigger",
            "trigger" => "serverboards.test.auth/periodic.timer",
            "params" => %{
              "period" => "0.1"
            }
          },
          "actions" => [
            %{
              "type" => "action",
              "action" => "serverboards.test.auth/touchfile",
              "params" => %{
                "filename" => "/tmp/rule-v2-3.test"
              }
            },
            %{
              "type" => "action",
              "action" => "serverboards.test.auth/touchfile",
              "params" => %{
                "filename" => "/tmp/rule-v2-32.test"
              }
            }
          ]
        }
      })

    :timer.sleep(1_000)

    {res1, _} = File.stat("/tmp/rule-v2-3.test")
    assert res1 == :ok
    File.rm("/tmp/rule-v2-3.test")

    {res1, _} = File.stat("/tmp/rule-v2-32.test")
    assert res1 == :ok
    File.rm("/tmp/rule-v2-32.test")

    {res2, _} = File.stat("/tmp/rule-v2-2.test")
    File.rm("/tmp/rule-v2-2.test")
    assert res2 == :error

    {:ok, rule} = Test.Client.call(client, "rules_v2.get", [uuid])
    Logger.info("Rule state: #{inspect(rule["state"])}")
    assert rule["state"] != nil
    assert rule["state"] != %{}
    assert rule["state"]["uuid"] == uuid
    assert rule["state"]["A"]["id"] == uuid
    assert rule["state"]["A"]["period"] == "0.1"
    assert rule["state"]["A"]["state"] == "tick"
    assert is_number(rule["state"]["A"]["count"])
    assert rule["state"]["A"]["count"] >= 1
  end

  test "Rule templates" do
    uuid = UUID.uuid4()

    {:ok, service_uuid} =
      Serverboards.Service.service_add(
        %{"name" => "Test service", "config" => %{"url" => "http://localhost"}},
        Test.User.system()
      )

    rule = %{
      uuid: uuid,
      name: "test",
      description: "description",
      from_template: "serverboards.test.auth/rule.template",
      rule: %{
        "template_data" => %{
          "period" => 1,
          "randomp" => 1.0,
          "filename" => "/tmp/s10s-rule-template-test.tmp",
          "service" => service_uuid
        }
      }
    }

    _template = Serverboards.Plugin.Registry.find("serverboards.test.auth/rule.template")
    {:ok, _pid} = Serverboards.RulesV2.Rule.start_link(rule)

    %{rule: rule} = Serverboards.RulesV2.Rule.status(uuid)
    Logger.info("Real rule #{inspect(rule, pretty: true)}")

    {:ok, content} =
      Serverboards.Utils.map_get(rule.rule["actions"], [1, "then", 0, "params", "content"])

    assert String.contains?(content, "http://localhost")
  end

  test "Webhooks" do
    {:ok, client} = Test.Client.start_link(as: "dmoreno@serverboards.io")

    http_pid =
      case Serverboards.IO.HTTP.start_link(port: 8080) do
        {:ok, http_pid} -> http_pid
        {:error, _} -> nil
      end

    {:ok, _service_uuid} =
      Serverboards.Service.service_add(
        %{"name" => "Test service", "config" => %{"url" => "http://localhost"}},
        Test.User.system()
      )

    rule = %{
      "name" => "test",
      "description" => "description",
      "rule" => %{
        "when" => %{
          "id" => "A",
          "trigger" => "serverboards.test.auth/webhook",
          "params" => %{
            "required" => "ext"
          }
        },
        "actions" => [
          %{
            "type" => "action",
            "action" => "serverboards.test.auth/touchfile",
            "params" => %{
              "filename" => "/tmp/rule-webhooks.{{A.data.ext}}"
            }
          }
        ]
      },
      "is_active" => true
    }

    {:ok, uuid} = Test.Client.call(client, "rules_v2.create", rule)

    :timer.sleep(200)

    {res1, _} = File.stat("/tmp/rule-webhooks.test")

    if res1 == :ok do
      File.rm("/tmp/rule-webhooks.test")
    end

    response = HTTPoison.get!("http://localhost:8080/webhook/#{uuid}?ext=test")
    Logger.debug("Response #{inspect(response)}")
    assert response.status_code == 200
    :timer.sleep(200)
    {:ok, _} = File.stat("/tmp/rule-webhooks.test")
    File.rm("/tmp/rule-webhooks.test")

    response =
      HTTPoison.post!(
        "http://localhost:8080/webhook/#{uuid}",
        Poison.encode!(%{"ext" => "test"}),
        [{"Content-Type", "application/json"}]
      )

    Logger.debug("Response #{inspect(response)}")
    assert response.status_code == 200
    :timer.sleep(200)
    {:ok, _} = File.stat("/tmp/rule-webhooks.test")
    File.rm("/tmp/rule-webhooks.test")

    response =
      HTTPoison.post!(
        "http://localhost:8080/webhook/#{uuid}",
        "ext=test",
        [{"Content-Type", "application/x-www-form-urlencoded"}]
      )

    Logger.debug("Response #{inspect(response)}")
    assert response.status_code == 200
    :timer.sleep(200)
    {:ok, _} = File.stat("/tmp/rule-webhooks.test")
    File.rm("/tmp/rule-webhooks.test")

    # boundary needs -- at begining.
    response =
      HTTPoison.post!(
        "http://localhost:8080/webhook/#{uuid}",
        "-----TEST\r\nContent-Disposition: form-data; name=\"ext\"\r\n\r\ntest\r\n-----TEST--\r\n",
        [{"Content-Type", "multipart/form-data; boundary=---TEST"}]
      )

    Logger.debug("Response #{inspect(response)}")
    assert response.status_code == 200
    :timer.sleep(200)
    {:ok, _} = File.stat("/tmp/rule-webhooks.test")
    File.rm("/tmp/rule-webhooks.test")

    if http_pid do
      Process.exit(http_pid, :normal)
    end
  end
end
