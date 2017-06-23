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
  def update(issue_id, %{ type: _, data: _} = data, me) do
    EventSourcing.dispatch(:issues, :issue_update, %{ id: issue_id, data: data}, me.email)
    {:ok, :ok}
  end

  def add_real(data, me) do
    import Ecto.Query
    creator_id = case Serverboards.Auth.User.get_id_by_email( me ) do
      {:ok, creator_id} -> creator_id
      _ -> nil
    end
    {:ok, issue} = Repo.insert( %Model.Issue{
      creator_id: creator_id,
      title: data.title,
      status: "open"
      } )
    {:ok, _description} = Repo.insert( %Model.Event{
      creator_id: creator_id,
      issue_id: issue.id,
      type: "new_issue",
      data: data
    } )

    (data[:aliases] || []) |> Enum.map(fn alias_ ->
      set_alias(issue.id, alias_)
    end)

    {:ok, issue} = get(issue.id)
    Serverboards.Event.emit("issue.created", %{ issue: issue}, ["issues.view"])
    for a <- issue.aliases do
      Serverboards.Event.emit("issue.created[#{a}]", %{ issue: issue}, ["issues.view"])
    end

    issue.id
  end
  def update_real(issue_id, %{ data: data } = update, me) when not is_map(data) do
    update_real(issue_id, %{ update | data: %{ "__data__" => data }}, me)
  end
  def update_real(issue_id, %{ type: type, data: data }, me) when is_number(issue_id) do
    import Ecto.Query
    creator_id = case Serverboards.Auth.User.get_id_by_email( me ) do
      {:ok, creator_id} -> creator_id
      _ -> nil
    end
    {:ok, _description} = Repo.insert( %Model.Event{
      creator_id: creator_id,
      issue_id: issue_id,
      type: type,
      data: data
      } )
    case type do
      "change_status" ->
        Repo.update_all(
          (from i in Model.Issue, where: i.id == ^issue_id),
          set: [status: data["__data__"] ]
        )
      "set_labels" ->
        set_labels(issue_id, data["__data__"])
      "unset_labels" ->
        unset_labels(issue_id, data["__data__"])
      "alias" ->
        set_alias(issue_id, data["__data__"])
      "unalias" ->
        unset_alias(issue_id, data["__data__"])
      _ -> :ok
    end
    update_updated_at(issue_id)

    {:ok, issue} = get(issue_id)
    Serverboards.Event.emit("issue.updated", %{ issue: issue}, ["issues.view"])
    Serverboards.Event.emit("issue.updated[#{issue_id}]", %{ issue: issue}, ["issues.view"])
    for a <- issue.aliases do
      Serverboards.Event.emit("issue.updated[#{a}]", %{ issue: issue}, ["issues.view"])
    end
    :ok
  end
  def update_real(alias_id, data, me) do
    alias_to_ids(alias_id) |> Enum.map(fn issue_id ->
      update_real(issue_id, data, me)
    end)
  end

  def update_updated_at(issue_id) do
    import Ecto.Query
    Logger.info("Update updated at")

    (from i in Model.Issue,
      where: i.id == ^issue_id,
      update: [set: [updated_at: fragment("?", "NOW()")]]
    ) |>  Repo.update_all([])

    Logger.info("DONE Update updated at")
  end

  def set_labels(issue_id, labels) do
    for label <- labels do
      set_label(issue_id, label)
    end
    nil
  end
  def unset_labels(issue_id, labels) do
    import Ecto.Query
    Repo.delete_all(
       from il in Model.IssueLabel,
       join: l in Model.Label,
         on: l.id == il.label_id,
      where: l.name in ^labels and il.issue_id == ^issue_id
      )
  end

  def set_alias(issue_id, aliases) when is_list(aliases) do
    Enum.map(aliases, &set_alias(issue_id, &1))
  end
  def set_alias(issue_id, alias_) do
    {:ok, _description} = Repo.insert( %Model.Alias{
      issue_id: issue_id,
      alias: alias_,
      } )
  end
  def unset_alias(issue_id, aliases) when is_list(aliases) do
    Enum.map(aliases, &unset_alias(issue_id, &1))
  end
  def unset_alias(issue_id, alias_) do
    import Ecto.Query
    Repo.delete_all(
       from al in Model.Alias,
      where: al.alias == ^alias_ and al.issue_id == ^issue_id
      )
  end
  @colors ~w(red orange yellow olive green teal blue violet purple pink brown grey black)
  def set_label(issue_id, label) do
    labelm = Repo.get_or_create(Model.Label, [name: label], %{ color: Enum.random(@colors) })
    {:ok, _} = Repo.insert( %Model.IssueLabel{ issue_id: issue_id, label_id: labelm.id } )
    :ok
  end

  def decorate_user(nil) do
    nil
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
    data = Map.get(event.data, "__data__", event.data)
    %{
      type: event.type,
      creator: decorate_user( event.creator ),
      data: data,
      inserted_at: Ecto.DateTime.to_iso8601(Ecto.DateTime.cast! event.inserted_at)
    }
  end
  def decorate_label(label) do
    %{
      color: label.color,
      name: label.name
    }
  end

  def get(id) when is_number(id) do
    import Ecto.Query
    case Repo.all( from i in Model.Issue, where: i.id == ^id, preload: [:events, :creator, :labels, :aliases] ) do
      [] -> {:error, :not_found}
      [issue] ->
        {:ok, %{
          id: issue.id,
          title: issue.title,
          creator: decorate_user(issue.creator),
          inserted_at: Ecto.DateTime.to_iso8601(Ecto.DateTime.cast! issue.inserted_at),
          status: issue.status,
          events: Enum.map(issue.events, &decorate_event/1 ),
          labels: Enum.map(issue.labels, &decorate_label/1 ),
          aliases: Enum.map(issue.aliases, &(&1.alias))
        }}
    end
  end
  def get(id) do
    [issue_id | _ ] = alias_to_ids(id)
    get(issue_id)
  end
  def alias_to_ids(alias_id) when is_integer(alias_id) do
    [alias_id]
  end
  def alias_to_ids(alias_id) do
    import Ecto.Query
    case Integer.parse(alias_id) do
      { id, "" } ->
        [id]
      _ ->
        Repo.all(
          from a in Model.Alias,
          join: i in Model.Issue, on: i.id == a.issue_id,
          where: a.alias == ^alias_id and i.status=="open",
          select: a.issue_id )
    end
  end
end
