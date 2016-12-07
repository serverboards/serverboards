require Logger

defmodule Serverboards.Issues.Issue do
  alias Serverboards.Repo
  alias Serverboards.Issues.Model

  def add(%{} = data, me) do
    import Ecto.Query
    {:ok, EventSourcing.dispatch(:issues, :issue_add, data, me.email).issue_id}
    #case Repo.all( from i in Model.Issue, order_by: [:id], select: i.id ) do
    #  [id] -> {:ok, id}
    #  [] -> {:error, :unknown_issue}
    #end
  end
  def update(issue_id, %{ type: _, data: _, title: _} = data, me) do
    EventSourcing.dispatch(:issues, :issue_update, %{ id: issue_id, data: data}, me.email)
    {:ok, :ok}
  end

  def add_real(data, me) do
    import Ecto.Query
    {:ok, creator_id} = Serverboards.Auth.User.get_id_by_email( me )
    {:ok, issue} = Repo.insert( %Model.Issue{
      creator_id: creator_id,
      title: data.title,
      status: "open"
      } )
    first_line = Enum.at(String.split(data.description, "\n", parts: 2), 0)
    {:ok, _description} = Repo.insert( %Model.Event{
      creator_id: creator_id,
      issue_id: issue.id,
      title: first_line,
      type: "comment",
      data: %{
        comment: data.description
      } } )

    issue.id
  end
  def update_real(issue_id, %{ title: title, type: type, data: data }, me) do
    import Ecto.Query
    {:ok, creator_id} = Serverboards.Auth.User.get_id_by_email( me )
    {:ok, _description} = Repo.insert( %Model.Event{
      creator_id: creator_id,
      issue_id: issue_id,
      title: title,
      type: type,
      data: data
      } )
  end

  def decorate_user(user) do
    %{
      email: user.email,
      is_active: user.is_active,
      name: user.name
    }
  end
  def decorate_event(event) do
    event = event |> Repo.preload(:creator)
    %{
      type: event.type,
      creator: decorate_user( event.creator ),
      data: event.data,
      title: event.title,
      inserted_at: Ecto.DateTime.to_iso8601(event.inserted_at)
    }
  end

  def get(id) do
    import Ecto.Query
    case Repo.all( from i in Model.Issue, where: i.id == ^id, preload: [:events, :creator] ) do
      [] -> {:error, :not_found}
      [issue] ->
        {:ok, %{
          id: issue.id,
          title: issue.title,
          creator: decorate_user(issue.creator),
          events: Enum.map(issue.events, &decorate_event/1 )
        }}
    end
  end
end
