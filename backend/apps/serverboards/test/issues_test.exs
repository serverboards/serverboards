require Logger

defmodule Serverboards.IssuesTest do
  use ExUnit.Case
  @moduletag :capture_log

  alias Serverboards.Issues.Issue
  alias Serverboards.Issues

  setup do
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(Serverboards.Repo)
    Ecto.Adapters.SQL.Sandbox.mode(Serverboards.Repo, {:shared, self()})
    %{}
  end

  test "Create and update basic issue" do
    {:ok, user} = Serverboards.Auth.User.user_info "dmoreno@serverboards.io"
    {:ok, id} = Issue.add %{ title: "Issue test", description: "This is the description of the issue." }, user
    assert id > 0

    {:ok, issue} = Issue.get(id)

    assert issue.id == id
    assert issue.creator.email == "dmoreno@serverboards.io"
    assert Enum.count(issue.events) == 1
    assert Enum.at(issue.events,0).type == "new_issue"
    assert Enum.at(issue.events,0).data == %{ "description" => "This is the description of the issue.", "title" => "Issue test" }

    {:ok, _} = Issue.update id, %{ type: "comment", data: "Good remark.\n\nThanks for the issue report." }, user
    {:ok, issue} = Issue.get(id)
    assert Enum.count(issue.events) == 2
    assert Enum.at(issue.events,1).type == "comment"
    assert Enum.at(issue.events,1).data == "Good remark.\n\nThanks for the issue report."

    issues = Issues.list
    assert Enum.count(issues) > 0
  end

  test "Create issue using RPC" do
    {:ok, client} = Test.Client.start_link as: "dmoreno@serverboards.io"

    {:ok, issue_id} = Test.Client.call(client, "issues.create", %{ title: "From RPC", description: "This is a new issue" })
    assert issue_id > 0
    {:ok, issue} = Test.Client.call(client, "issues.get", [issue_id])
    Logger.info(inspect issue)
    assert issue["title"] == "From RPC"
    assert issue["events"] != []

    {:ok, _issue} = Test.Client.call(client, "issues.update", [issue_id, %{ type: :comment, data: %{ comment: "A comment.\n\nFull."}}])
    {:ok, issue} = Test.Client.call(client, "issues.get", [issue_id])
    Logger.info(inspect issue)

    assert issue["title"] == "From RPC"
    assert Enum.count(issue["events"]) == 2

    {:ok, issues} = Test.Client.call(client, "issues.list", [])

    Logger.info(inspect issues)

  end

  test "Create issue with alias" do
    {:ok, client} = Test.Client.start_link as: "dmoreno@serverboards.io"

    {:ok, issue_id} = Test.Client.call(client, "issues.create", %{ title: "From alias", description: "This is a new issue", aliases: ["test/1111"] })
    {:ok, issue} = Test.Client.call(client, "issues.get", ["test/1111"])

    assert issue["id"] == issue_id

    {:ok, _issue} = Test.Client.call(client, "issues.update", ["test/1111", %{ type: :comment, data: "A comment.\n\nFull."}])
    {:ok, issue} = Test.Client.call(client, "issues.get", [issue_id])

    Logger.info(inspect issue)

    assert issue["title"] == "From alias"

    # can be listed by alias
    {:ok, issues} = Test.Client.call(client, "issues.list", %{ alias: "test/1111"})
    Logger.info(inspect issues)

    assert Enum.count(issues) > 0
  end

  test "Status changes" do
    {:ok, client} = Test.Client.start_link as: "dmoreno@serverboards.io"

    {:ok, issue_id} = Test.Client.call(client, "issues.create", %{ title: "From RPC", description: "This is a new issue" })
    {:ok, _issue} = Test.Client.call(client, "issues.update", [issue_id, [
        %{ type: :comment, data: "Closing issue"},
        %{ type: :change_status, data: "closed"}
      ]])

    {:ok, issue} = Test.Client.call(client, "issues.get", [issue_id])

    Logger.info(inspect issue)

    assert issue["status"] == "closed"
  end

  test "Set labels" do
    {:ok, client} = Test.Client.start_link as: "dmoreno@serverboards.io"

    {:ok, issue_id} = Test.Client.call(client, "issues.create", %{ title: "From RPC", description: "This is a new issue" })
    {:ok, _issue} = Test.Client.call(client, "issues.update", [issue_id, [
        %{ type: :comment, data: "Set labels"},
        %{ type: :set_labels, data: ["one", "two"]}
      ]])

    {:ok, issue} = Test.Client.call(client, "issues.get", [issue_id])
    assert Enum.map(issue["labels"], &(&1["name"])) == ["one","two"]

    # Now list, get labels
    {:ok, issues} = Test.Client.call(client, "issues.list", [])
    Logger.info(inspect issues)

    assert Enum.find(issues, &(&1["id"]==issue["id"]))["labels"]==issue["labels"]

    # unset
    {:ok, _issue} = Test.Client.call(client, "issues.update", [issue_id, [
        %{ type: :comment, data: "Unset labels"},
        %{ type: :unset_labels, data: ["one"]}
      ]])
    {:ok, issue} = Test.Client.call(client, "issues.get", [issue_id])
    assert Enum.map(issue["labels"], &(&1["name"])) == ["two"]
  end

  test "Complex lists" do
    {:ok, client} = Test.Client.start_link as: "dmoreno@serverboards.io"

    Test.Client.call(client, "event.subscribe", ["issue.created", "issue.updated"])
    {:ok, issue_id} = Test.Client.call(client, "issues.create", %{ title: "At least one for tests", description: "Test issue", aliases: ["project/TEST"] })

    res = Test.Client.call(client, "issues.list", %{ project: "TEST", since: "2017-01-01", return: "count" })
    Logger.debug(inspect res)
    assert {:ok, 1} == res

    {:ok, list} = Test.Client.call(client, "issues.list", %{ project: "TEST", since: "2017-01-01", project: "TEST" })
    Logger.debug(inspect list)
    issue = List.first(list)

    assert {:ok, []} == Test.Client.call(client, "issues.list", %{ project: "TEST", since: "2050-01-01", project: "TEST" })
    assert {:ok, []} == Test.Client.call(client, "issues.list", %{ project: "TEST", since: issue["updated_at"], project: "TEST" })
    assert {:ok, []} == Test.Client.call(client, "issues.list", %{ project: "TEST", since: "2017-01-01", count: 0, project: "TEST" })

    {:ok, _issue_id} = Test.Client.call(client, "issues.create", %{ title: "Second one for since test", description: "Test since issue", aliases: ["project/TEST"] })
    {:ok, [issue2]} = Test.Client.call(client, "issues.list", %{ project: "TEST", since: issue["updated_at"], project: "TEST" })
    assert Test.Client.expect(client, method: "issue.created")

    # update issue1 with a comment, should update updated_at.
    {:ok, _issue} = Test.Client.call(client, "issues.update", [issue_id, [
        %{ type: :comment, data: "Set labels"},
        %{ type: :set_labels, data: ["one"]}
      ]])
    assert Test.Client.expect(client, method: "issue.updated")

    {:ok, since_items} = Test.Client.call(client, "issues.list", %{ project: "TEST", since: issue["updated_at"], project: "TEST" })
    Logger.info("Got #{Enum.count(since_items)} // #{inspect since_items} from #{inspect issue["updated_at"]}")
    # {:ok, res} = Test.Client.call(client, "issues.list", %{ project: "TEST", project: "TEST" })
    # Logger.debug("All #{inspect res} from #{inspect issue["updated_at"]}")
    {:ok, count} = Test.Client.call(client, "issues.list", %{ project: "TEST", since: issue["updated_at"], return: "count" })
    Logger.info("Count #{inspect count}")
    assert 1 == count
  end

end
