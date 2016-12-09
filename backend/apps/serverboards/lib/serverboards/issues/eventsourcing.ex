require Logger

defmodule Serverboards.Issues.EventSourcing do
  def start_link(options \\ []) do
    {:ok, es} = EventSourcing.start_link name: :issues

    EventSourcing.Model.subscribe es, :notifications, Serverboards.Repo

    EventSourcing.subscribe es, :issue_add, fn attributes, me ->
      Serverboards.Issues.Issue.add_real attributes, me
    end, name: :issue_id
    EventSourcing.subscribe es, :issue_update, fn %{ id: id, data: data}, me ->
      Serverboards.Issues.Issue.update_real(id, data, me)
    end

    {:ok, es}
  end
end
