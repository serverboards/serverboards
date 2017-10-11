require Logger

defmodule Serverboards.Issues.EventSourcing do
  def start_link(options \\ []) do
    {:ok, es} = EventSourcing.start_link [name: :issues] ++ options

    EventSourcing.Model.subscribe es, :notifications, Serverboards.Repo

    EventSourcing.subscribe es, :issue_add, fn attributes, me ->
      id = Serverboards.Issues.Issue.add_real attributes, me

      url= Serverboards.Config.get(:"serverboards.core.settings/base","base_url", "http://localhost:8000/")
      url = "#{url}#/issues/#{id}"
      data = Map.merge(attributes, %{ "url" => url, "message_id" => "serverboards-issue-#{id}", "type" => "ISSUE_OPEN" })

      Serverboards.Notifications.notify "@user", "New Issue ##{id}: #{attributes.title}", attributes.description, data, %{ email: me }
      id
    end, name: :issue_id
    EventSourcing.subscribe es, :issue_update, fn %{ id: id, data: data}, me ->
      # get only first, although this alias may have several ids. If none, id should be the alias
      # get id first, as we may be closing
      id = case Serverboards.Issues.Issue.alias_to_ids(id) do
        [ id | _ ] -> id
        _ -> id
      end

      Serverboards.Issues.Issue.update_real(id, data, me)

      text = case data.data do
        d when is_map(d) -> inspect(d)
        l when is_list(l) -> inspect(l)
        t -> t
      end
      url= Serverboards.Config.get(:"serverboards.core.settings/base","base_url", "http://localhost:8000/")
      url = "#{url}#/issues/#{id}"

      type = case data[:type] do
        "change_status" ->
          case data[:data] do
            "closed" -> "ISSUE_CLOSED"
            _ -> "MESSAGE"
          end
        "comment" -> "MESSAGE"
        o -> o
      end
      data = Map.merge(data, %{ "url" => url, "thread_id" => "serverboards-issue-#{id}", :type => type })

      Serverboards.Notifications.notify "@user", "Issue ##{id} updated: #{data.type}", text, data, %{ email: me, thread_id: "serverboards-issue-#{id}" }
    end

    {:ok, es}
  end
end
