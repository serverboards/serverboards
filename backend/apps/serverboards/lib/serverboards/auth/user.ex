require Logger

defmodule Serverboards.Auth.User do
  import Ecto.Query

  alias MOM
  alias Serverboards.Auth.Model
  alias Serverboards.Repo

  def setup_eventsourcing(es) do
    EventSourcing.subscribe es, :add_user, fn attributes, _me ->
			{:ok, user} = Repo.insert(%Model.User{
				email: attributes.email,
        name: attributes.name,
        is_active: Map.get(attributes, :is_active, true)
				})
      {:ok, user} = user_info user
      Serverboards.Event.emit("user.added", %{ user: user}, ["auth.create_user"])
    end
    EventSourcing.subscribe es, :update_user, fn %{ user: email, operations: operations }, _me ->
      user = Repo.get_by!(Model.User, email: email)
      {:ok, user} = Repo.update(
        Model.User.changeset(user, operations)
      )
      {:ok, user} = user_info user
      Serverboards.Event.emit("user.updated", %{ user: user}, ["auth.modify_any"])
      Serverboards.Event.emit("user.updated", %{ user: user}, %{ user: user.email} )
    end
  end

  @doc ~S"""
  Creates a new user with the given parameters
  """
  def user_add(user, %{ perms: perms, email: email } = me ) do
    Logger.debug("Add user by #{inspect me}")

    if Enum.member? perms, "auth.create_user" do
      EventSourcing.dispatch Serverboards.Auth.EventSourcing, :add_user, user, email
      :ok
    else
      {:error, :not_allowed}
    end
  end

  @doc ~S"""
  Updates some fields at the user
  """
  def user_update(email, operations, me) do
    if (Enum.member? me.perms, "auth.modify_any") or
       (email==me.email and (Enum.member? me.perms, "auth.modify_self")) do
         EventSourcing.dispatch Serverboards.Auth.EventSourcing, :update_user, %{ user: email, operations: operations }, me.email
         :ok
    else
      {:error, :not_allowed}
    end
  end

  @doc ~S"""
  Gets an user by email, and updates permissions. Its for other auth modes,
  as token, or external.
  """
  def user_info(email) when is_binary(email) do
    user_info(email, %{ email: email })
  end
  def user_info(email, me) when is_binary(email) do
    user_info(email, [], me)
  end
  def user_info(email, options, me) when is_binary(email) and is_map(me) do
    if (me.email == email) or (Enum.member? me.perms, "auth.info_any_user") do
      user=Repo.get_by(Model.User, email: email)

      cond do
        user == nil ->
          Logger.debug("No such user #{email}")
          {:error, :unknown_user}
        Keyword.get(options, :require_active, true) and not user.is_active ->
          Logger.warn("Trying to get non available user by email: #{email}", email: email, me: me)
          {:error, :unknown_user}
        true ->
          user_info(user)
      end
    else
      Logger.error("User #{me.email} can not get info about user #{email}")
      {:error, :not_allowed}
    end
  end
  # final decorator, if everything ok on the other, if finishes here
  def user_info(%{} = user) do
    {:ok, %{
      id: user.id,
      email: user.email,
      name: user.name,
      is_active: user.is_active,
      perms: get_perms(user),
      groups: get_groups(user)
    }}
  end


  def user_list(_me) do
    Repo.all( from u in Model.User, select: [u.id, u.email, u.is_active, u.name] )
      |> Enum.map( fn [id, email, is_active, name] ->
        groups = Repo.all(
            from g in Model.Group,
           join: ug in Model.UserGroup,
             on: ug.group_id == g.id,
          where: ug.user_id == ^id,
         select: g.name
          )

        %{
          email: email,
          is_active: is_active,
          name: name,
          groups: groups
        }
      end)
  end

  ~S"""
  Gets all permissions for this user
  """
  defp get_perms(user) do
    alias Serverboards.Auth.Model
    alias Serverboards.Repo

    Repo.all(
      from p in Model.Permission,
        join: gp in Model.GroupPerms,
          on: gp.perm_id == p.id,
        join: ug in Model.UserGroup,
          on: ug.group_id == gp.group_id,
       where: ug.user_id == ^user.id,
      select: p.code
    )
  end

  defp get_groups(user) do
    Repo.all(
         from g in Model.Group,
        join: ug in Model.UserGroup,
          on: ug.group_id == g.id,
       where: ug.user_id == ^user.id,
      select: g.name
    )
  end

  def get_id_by_email(email) do
    case Repo.all(
      from u in Model.User,
      where: u.email == ^email,
      select: u.id
    ) do
      [id] -> {:ok, id}
      [] -> {:error, :not_found}
    end
  end

end
