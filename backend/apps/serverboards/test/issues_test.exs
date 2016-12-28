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

    {:ok, issue_id} = Test.Client.call(client, "issues.add", %{ title: "From RPC", description: "This is a new issue" })
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

    {:ok, issue_id} = Test.Client.call(client, "issues.add", %{ title: "From alias", description: "This is a new issue", aliases: ["test/1111"] })
    {:ok, issue} = Test.Client.call(client, "issues.get", ["test/1111"])

    assert issue["id"] == issue_id

    {:ok, _issue} = Test.Client.call(client, "issues.update", ["test/1111", %{ type: :comment, data: "A comment.\n\nFull."}])
    {:ok, issue} = Test.Client.call(client, "issues.get", [issue_id])

    Logger.info(inspect issue)

    assert issue["title"] == "From alias"
  end

  test "Status changes" do
    {:ok, client} = Test.Client.start_link as: "dmoreno@serverboards.io"

    {:ok, issue_id} = Test.Client.call(client, "issues.add", %{ title: "From RPC", description: "This is a new issue" })
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

    {:ok, issue_id} = Test.Client.call(client, "issues.add", %{ title: "From RPC", description: "This is a new issue" })
    {:ok, _issue} = Test.Client.call(client, "issues.update", [issue_id, [
        %{ type: :comment, data: "Closing issue"},
        %{ type: :set_labels, data: ["one", "two"]}
      ]])

    {:ok, issue} = Test.Client.call(client, "issues.get", [issue_id])

    Logger.info(inspect issue)
    assert Enum.map(issue["labels"], &(&1["name"])) == ["one","two"]

    # Now list, get labels
    {:ok, issues} = Test.Client.call(client, "issues.list", [])
    Logger.info(inspect issues)

    assert Enum.find(issues, &(&1["id"]==issue["id"]))["labels"]==issue["labels"]
  end

end
