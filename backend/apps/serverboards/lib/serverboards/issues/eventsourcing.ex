require Logger

defmodule Serverboards.Issues.EventSourcing do
  def start_link(options \\ []) do
    {:ok, es} = EventSourcing.start_link name: :issues

    EventSourcing.Model.subscribe es, :notifications, Serverboards.Repo

    EventSourcing.subscribe es, :issue_add, fn attributes, me ->
      id = Serverboards.Issues.Issue.add_real attributes, me
      Serverboards.Notifications.notify "@user", "New Issue #{id}: #{attributes.title}", attributes.description, attributes, %{ email: me }
      id
    end, name: :issue_id
    EventSourcing.subscribe es, :issue_update, fn %{ id: id, data: data}, me ->
      Serverboards.Issues.Issue.update_real(id, data, me)

      text = case data.data do
        d when is_map(d) -> inspect(d)
        t -> t
      end
      # get only first, although this alias may have several ids. If none, id should be the alias
      id = case Serverboards.Issues.Issue.alias_to_ids(id) do
        [ id | _ ] -> id
        _ -> id
      end
      url= Serverboards.Config.get(:"serverboards.core.settings/base","base_url", "http://localhost:8000/")
      url = "#{url}#/issues/#{id}"

      data = Map.put(data, "url", url)

      body = "#{text}\n\n#{url}"
      Serverboards.Notifications.notify "@user", "Issue #{id} updated: #{data.type}", body, data, %{ email: me }
    end

    {:ok, es}
  end
end
