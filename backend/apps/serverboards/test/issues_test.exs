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
    assert Enum.at(issue.events,0).type == "comment"
    assert Enum.at(issue.events,0).data == %{ "comment" => "This is the description of the issue." }

    {:ok, _} = Issue.update id, %{ type: "comment", title: "Good remark.", data: %{ :comment => "Good remark.\n\nThanks for the issue report." } }, user
    {:ok, issue} = Issue.get(id)
    assert Enum.count(issue.events) == 2
    assert Enum.at(issue.events,1).type == "comment"
    assert Enum.at(issue.events,1).title == "Good remark."
    assert Enum.at(issue.events,1).data == %{ "comment" => "Good remark.\n\nThanks for the issue report." }

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

    {:ok, issue} = Test.Client.call(client, "issues.update", [issue_id, %{ type: :comment, title: "A comment", data: %{ comment: "A comment.\n\nFull."}}])
    {:ok, issue} = Test.Client.call(client, "issues.get", [issue_id])
    Logger.info(inspect issue)

    assert issue["title"] == "From RPC"
    assert Enum.count(issue["events"]) == 2

    {:ok, issues} = Test.Client.call(client, "issues.list", [])

    Logger.info(inspect issues)

  end
end
