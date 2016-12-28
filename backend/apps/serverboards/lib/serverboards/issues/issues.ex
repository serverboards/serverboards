defmodule Serverboards.Issues do
  alias Serverboards.Issues.Model

  def start_link(options \\ []) do
    import Supervisor.Spec
    children = [
      worker(Serverboards.Issues.EventSourcing, [[name: Serverboards.Issues.EventSourcing]]),
      worker(Serverboards.Issues.RPC, [[name: Serverboards.Issues.RPC]])
    ]

    {:ok, pid} = Supervisor.start_link(children, strategy: :one_for_one)
  end

  def decorate_issues_list(i) do
    %{
      id: i.id,
      title: i.title,
      creator: Serverboards.Issues.Issue.decorate_user(i.creator),
      status: i.status,
      date: Ecto.DateTime.to_iso8601(i.inserted_at),
      labels: Enum.map(i.labels, &Serverboards.Issues.Issue.decorate_label/1 )
    }
  end

  def list() do
    import Ecto.Query

    Serverboards.Repo.all(from i in Model.Issue, order_by: [desc: i.id], preload: [:creator, :labels])
     |> Enum.map(&decorate_issues_list/1)
  end

end
