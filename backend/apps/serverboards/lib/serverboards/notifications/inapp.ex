require Logger

defmodule Serverboards.Notifications.InApp do
  @moduledoc """
  This module stores and allow manipulation of database stores notifications.

  This doe snot follow standard notification via plugin to ensure that no
  failure can prevent it from being saved. Also it is a mandatory channel.

  Other that that, stores as a normal Channel would do, and allow quering.
  """
  alias Serverboards.Repo
  alias Serverboards.Notifications.Model

  def notify(email, subject, body, meta) do
    import Ecto.Query
    user_id = Repo.one( from u in Serverboards.Auth.Model.User, where: u.email == ^email, select: u.id )
    Logger.debug("#{inspect meta}")
    {:ok, _ } = Repo.insert( Model.Notification.changeset(
        %Model.Notification{},
        %{ user_id: user_id, subject: subject, body: body, meta: meta, tags: ["new","unread"] }
        ) )
    :ok
  end

  def list(filter, user) do
    import Ecto.Query
    q=   from m in Model.Notification,
        where: m.user_id == ^user.id,
     order_by: [desc: m.id],
       select: %{ subject: m.subject, body: m.body, tags: m.tags, meta: m.meta, inserted_at: m.inserted_at, id: m.id }

    # default values
    filter = Map.merge(%{"count" => 50}, filter)

    Logger.debug("#{inspect filter} #{inspect Map.to_list(filter)}")
    q = Enum.reduce(Map.to_list(filter), q, fn
      {"tags", tags}, q -> where(q, [m], fragment("tags @> ?", ^tags))
      {"count", count}, q -> limit(q, ^count)
      {"start", start}, q -> where(q, [m], m.start < ^start )

      {:tags, tags}, q -> where(q, [m], fragment("tags @> ?", ^tags))
      {:count, count}, q -> limit(q, ^count)
      {:start, start}, q -> where(q, [m], m.start < ^start )
    end)

    ret = Repo.all( q )
      |> Enum.map( fn n -> # post processing
        %{ n | inserted_at: Ecto.DateTime.to_iso8601(n.inserted_at)}
      end)


    # For those with new tags, remove it. Doing it manually, should be a single
    # query. Its a complex one, as it has to have the limit of messages,
    # ordering..., maybe later.
    Logger.debug("#{inspect ret}")
    ids = ret
      |> Enum.filter(&("new" in &1.tags))
      |> Enum.map(&(&1.id))
    Repo.update_all(
      (
        from n in Model.Notification,
        where: n.id in ^ids,
        update: [set: [tags: fragment("array_remove(tags, 'new')")]]
      ), [])

    {:ok, ret}
  end

end
