require Logger

defmodule Serverboards.Auth.User do
  import Ecto.Changeset
  import Ecto.Query

  alias Serverboards.MOM
  alias Serverboards.Auth.Model
  alias Serverboards.Repo

  def setup_eventsourcing(es) do
    EventSourcing.subscribe :auth, :add_user, fn attributes, me ->
			{:ok, user} = Repo.insert(%Model.User{
				email: attributes.email,
        first_name: attributes.first_name,
        last_name: attributes.last_name,
        is_active: Map.get(attributes, :is_active, true)
				})
      user = user_info user
      MOM.Channel.send( :client_events, %MOM.Message{ payload: %{ type: "user.added", data: %{ user: user} } } )
    end
    EventSourcing.subscribe :auth, :update_user, fn %{ user: email, operations: operations }, _me ->
      user = Repo.get_by!(Model.User, email: email)
      Repo.update(
        Model.User.changeset(user, operations)
      )
      user = user_info user
      MOM.Channel.send( :client_events, %MOM.Message{ payload: %{ type: "user.updated", data: %{ user: user} } } )
    end
  end

  @doc ~S"""
  Creates a new user with the given parameters
  """
  def user_add(user, me) do
    if Enum.member? me.perms, "auth.create_user" do
      EventSourcing.dispatch :auth, :add_user, user, me.email
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
         EventSourcing.dispatch :auth, :update_user, %{ user: email, operations: operations }, me.email
         :ok
    else
      {:error, :not_allowed}
    end
  end

  @doc ~S"""
  Gets an user by email, and updates permissions. Its for other auth modes,
  as token, or external.
  """
  def user_info(email, me) when is_binary(email) do
    user_info(email, [], me)
  end
  def user_info(email, options, me) when is_binary(email) do
    if (me.email == email) or (Enum.member? me.perms, "auth.info_any_user") do
      user=case Repo.get_by(Model.User, email: email) do
        {:error, _} ->
          Logger.warn("Try to get non existant user by email: #{email}")
          nil
        user -> user
      end

      cond do
        user == nil ->
          false
        Keyword.get(options, :require_active, true) and not user.is_active ->
          Logger.warn("Try to get non available user by email: #{email}")
          false
        true ->
          user_info(user)
      end
    else
      {:error, :not_allowed}
    end
  end

  def user_info(%{} = user) do
    %{
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      is_active: user.is_active,
      perms: get_perms(user),
      groups: get_groups(user)
    }
  end

  def user_list(me) do
    Repo.all( from u in Model.User, select: [u.id, u.email, u.is_active, u.first_name, u.last_name] )
      |> Enum.map( fn [id, email, is_active, first_name, last_name] ->
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
          first_name: first_name,
          last_name: last_name,
          groups: groups
        }
      end)
  end

   @doc ~S"""
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

end
