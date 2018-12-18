require Logger

defmodule Serverboards.Issues do
  alias Serverboards.Issues.Model

  def start_link(options \\ []) do
    import Supervisor.Spec

    children = [
      worker(Serverboards.Issues.EventSourcing, [[name: Serverboards.Issues.EventSourcing]]),
      worker(Serverboards.Issues.RPC, [[name: Serverboards.Issues.RPC]])
    ]

    Supervisor.start_link(children, [strategy: :one_for_one] ++ options)
  end

  def decorate_issues_list(i) do
    %{
      id: i.id,
      title: i.title,
      creator: Serverboards.Issues.Issue.decorate_user(i.creator),
      status: i.status,
      date: DateTime.to_iso8601(i.inserted_at),
      updated_at: DateTime.to_iso8601(i.updated_at),
      labels: Enum.map(i.labels, &Serverboards.Issues.Issue.decorate_label/1)
    }
  end

  def list(), do: list(%{})

  def list(filter) do
    import Ecto.Query

    q =
      from(i in Model.Issue,
        order_by: [desc: i.id]
      )

    q =
      if filter[:alias] do
        q
        |> join(:inner, [i], a in Model.Alias, i.id == a.issue_id)
        |> where([_i, a], a.alias == ^filter[:alias])
      else
        q
      end

    q =
      if filter[:project] do
        q
        |> join(:inner, [i, a], a in Model.Alias, i.id == a.issue_id)
        |> where([_i, a], a.alias == ^"project/#{filter[:project]}")
      else
        q
      end

    q =
      if filter[:return] == "count" do
        q
      else
        q |> preload([:creator, :labels])
      end

    q =
      if filter[:since] do
        since = filter[:since]

        since =
          if String.length(since) == 10 do
            since <> "T00:00:00"
          else
            since
          end

        q |> where([i], i.updated_at > ^since)
      else
        q
      end

    q =
      if filter[:start] do
        q |> where([i], i.id > ^filter[:id])
      else
        q
      end

    q =
      if filter[:count] do
        q |> limit(^filter[:count])
      else
        q
      end

    res =
      case Map.get(filter, :return, "issues") do
        "issues" ->
          Serverboards.Repo.all(q)
          |> Enum.map(&decorate_issues_list/1)

        "count" ->
          %{
            count: Serverboards.Repo.aggregate(q, :count, :id),
            timestamp: Serverboards.Repo.aggregate(q, :max, :updated_at)
          }
      end

    res
  end
end
