require Logger

defmodule Serverboards.Auth.User do
  import Ecto.Changeset
  import Ecto.Query

  alias Serverboards.Auth.Model
  alias Serverboards.Repo

  def setup_eventsourcing(es) do
    EventSourcing.subscribe :auth, :add_user, fn attributes, me ->
			Repo.insert(%Model.User{
				email: attributes.email,
        first_name: attributes.first_name,
        last_name: attributes.last_name,
        is_active: Map.get(attributes, :is_active, true)
				})
    end
  end

  @doc ~S"""
  Creates a new user with the given parameters
  """
  def user_add(user, me) do
    EventSourcing.dispatch :auth, :add_user, user, me.email
  end


  @doc ~S"""
  Gets an user by email, and updates permissions. Its for other auth modes,
  as token, or external.
  """
  def user_info(email, require_active \\ false) do
    user=case Repo.get_by(Model.User, email: email) do
      {:error, _} -> nil
      user -> user
    end

    user = if require_active and not user.is_active do
      nil
    else
      user
    end

    if user do
      %{
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        perms: get_perms(user)
      }
		else
      Logger.warn("Try to get non existent user by email: #{email}")
      false
    end
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

end
