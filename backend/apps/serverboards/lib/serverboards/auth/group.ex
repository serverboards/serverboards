import Ecto.Query

alias Serverboards.Repo
alias MOM
alias Serverboards.Auth
alias Serverboards.Auth.Model

defmodule Serverboards.Auth.Group do

  def setup_eventsourcing(es) do
    alias Serverboards.Repo

    EventSourcing.subscribe es, :add_group, fn %{name: name}, _me ->
      Repo.insert(%Model.Group{
          name: name
        })
      Serverboards.Event.emit("group.added", %{ group: name}, ["auth.modify_groups"])
    end

    EventSourcing.subscribe es, :remove_group, fn %{name: name}, _me ->
      case Repo.get_by(Model.Group, name: name) do
        nil ->
          false
        group ->
          Repo.delete_all( from pg in Model.GroupPerms, where: pg.group_id == ^group.id)
          Repo.delete_all( from ug in Model.UserGroup, where: ug.group_id == ^group.id)
          Repo.delete( group )
          Serverboards.Event.emit("group.removed", %{ group: name}, ["auth.modify_groups"])
      end
    end

    EventSourcing.subscribe es, :add_user_to_group, fn %{group: groupname, user: username}, _me ->
      group = Repo.get_by!(Model.Group, name: groupname)
      user = Repo.get_by!(Model.User, email: username)
      case Repo.get_by(Model.UserGroup, user_id: user.id, group_id: group.id) do
        nil ->
          Repo.insert( %Model.UserGroup{ user_id: user.id, group_id: group.id } )
        ug -> ug
      end
      Serverboards.Event.emit("group.user_added", %{ group: groupname, email: username}, ["auth.manage_groups"])
    end
    EventSourcing.subscribe es, :remove_user_from_group, fn %{ group: group, user: user}, _me ->
      to_delete = Repo.all(
        from gu in Model.UserGroup,
        join: g in Model.Group,
          on: g.id == gu.group_id,
        join: u in Model.User,
          on: u.id == gu.user_id,
        where: g.name == ^group and u.email == ^user,
       select: gu.id
      )
      Repo.delete_all( from gu in Model.UserGroup, where: gu.id in ^to_delete )
      Serverboards.Event.emit("group.user_removed", %{ group: group, email: user}, ["auth.manage_groups"])
      :ok
    end

    EventSourcing.subscribe es, :add_perm_to_group, fn %{ group: groupname, perm: code}, _me ->
      case Repo.one(
          from gp in Model.GroupPerms,
          join: g in Model.Group,
            on: g.id == gp.group_id,
          join: p in Model.Permission,
            on: p.id == gp.perm_id,
          where: g.name == ^groupname and p.code == ^code,
          select: p.id
          ) do
        nil ->
          group = Repo.get_by!(Model.Group, name: groupname)
          perm = Auth.Permission.ensure_exists(code)
          Repo.insert( %Model.GroupPerms{ group_id: group.id, perm_id: perm.id } )

          Serverboards.Event.emit("group.perm_added", %{ group: groupname, perm: code}, ["auth.manage_groups"])
          :ok
        _gp ->
           nil
      end
    end
    EventSourcing.subscribe es, :remove_perm_from_group, fn %{ group: group, perm: code}, _me ->
      to_delete = Repo.all(
        from gp in Model.GroupPerms,
        join: g in Model.Group,
          on: g.id == gp.group_id,
        join: p in Model.Permission,
          on: p.id == gp.perm_id,
       where: g.name == ^group and p.code == ^code,
      select: gp.id
      )
      Repo.delete_all( from gp in Model.GroupPerms, where: gp.id in ^to_delete )
      Serverboards.Event.emit("group.perm_removed", %{ group: group, perm: code}, ["auth.manage_groups"])
      :ok
    end

  end

  def group_add(name, me) when is_binary(name) do
    if Enum.member? me.perms, "auth.modify_groups" do
      EventSourcing.dispatch(Serverboards.Auth.EventSourcing, :add_group, %{name: name}, me.email)
      :ok
    else
      {:error, :not_allowed}
    end
  end

  def group_remove(name, me) when is_binary(name) do
    if Enum.member? me.perms, "auth.modify_groups" do
      EventSourcing.dispatch(Serverboards.Auth.EventSourcing, :remove_group, %{name: name}, me.email)
      :ok
    else
      {:error, :not_allowed}
    end
  end

  def user_add(group, user, me) when is_binary(group) and is_binary(user) do
    if Enum.member? me.perms, "auth.manage_groups" do
      EventSourcing.dispatch(Serverboards.Auth.EventSourcing, :add_user_to_group, %{group: group, user: user}, me.email)
      :ok
    else
      {:error, :not_allowed}
    end
  end
  def user_remove(group, user, me) when is_binary(group) and is_binary(user) do
    if Enum.member? me.perms, "auth.manage_groups" do
      EventSourcing.dispatch(Serverboards.Auth.EventSourcing, :remove_user_from_group, %{group: group, user: user}, me.email)
      :ok
    else
      {:error, :not_allowed}
    end
  end

  def perm_add(group, perm, me) when is_binary(group) and is_binary(perm) do
    if Enum.member? me.perms, "auth.manage_groups" do
      EventSourcing.dispatch(Serverboards.Auth.EventSourcing, :add_perm_to_group, %{group: group, perm: perm}, me.email)
      :ok
    else
      {:error, :not_allowed}
    end
  end

  def perm_remove(group, perm, me) when is_binary(group) and is_binary(perm) do
    if Enum.member? me.perms, "auth.manage_groups" do
      EventSourcing.dispatch(Serverboards.Auth.EventSourcing, :remove_perm_from_group, %{group: group, perm: perm}, me.email)
      :ok
    else
      {:error, :not_allowed}
    end
  end

  @doc ~S"""
  List of all groups
  """
  def group_list(_me) do
    Repo.all(
      from g in Model.Group, select: g.name
    )
  end

  @doc ~S"""
  Retuns a list of user (by email) that belong to that group.
  """
  def user_list(group, _me) do
    Repo.all(
       from u in Model.User,
      join: ug in Model.UserGroup,
        on: u.id == ug.user_id,
      join: g in Model.Group,
        on: g.id == ug.group_id,
     where: g.name == ^group,
     select: u.email
    )
  end
  @doc ~S"""
  Retuns a list of user (by email) that belong to that group.
  """
  def active_user_list(group, _me) do
    Repo.all(
       from u in Model.User,
      join: ug in Model.UserGroup,
        on: u.id == ug.user_id,
      join: g in Model.Group,
        on: g.id == ug.group_id,
     where: g.name == ^group and u.is_active,
     select: u.email
    )
  end

  @doc ~S"""
  List permissions at that group
  """
  def perm_list(group, me) do
    if Enum.member? me.perms, "auth.manage_groups" do
      Repo.all(
        from p in Model.Permission,
        join: pg in Model.GroupPerms,
          on: pg.perm_id == p.id,
        join: g in Model.Group,
          on: pg.group_id == g.id,
       where: g.name == ^group,
      select: p.code
      )
    else
      {:error, :not_allowed}
    end
  end
end
