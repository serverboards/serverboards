# Initial data.
# It is initialized once at start, but it is idempotent so it could be run
# several times. It will always reset admin password to "serverboards", which
# will require a password change after first use.
#
# It can be run manually with:
#   MIX_ENV=prod mix run priv/repo/seed.exs
#
require Logger

password = case System.get_env("SERVERBOARDS_PASSWORD") do
  nil ->
    {:ok, password} = File.read('/etc/hostname')
    password
  other -> other
end

data = [
  groups: [
    %{ name: "user", perms: []},
    %{ name: "admin", perms: :all_perms}
    ],
  users: [
      %{
        email: "admin@serverboards.io",
        name: "Admin",
        is_active: true,
        groups: ["user", "admin"]
      }
    ],
  password: [ {"admin@serverboards.io", String.trim(password)} ],
]


defmodule Seeds do
  alias Serverboards.Repo
  alias Serverboards.Auth.Model
  alias Serverboards.Auth

  def all_perms do
    [
    "auth.modify_self", "auth.modify_any",
    "auth.create_user", "auth.token.add",
    "auth.info_any_user",
    "auth.modify_groups", "auth.manage_groups",
    "plugin",
    "project.add", "project.update",
    "project.delete", "project.get",
    "project.widget.add", "project.widget.update",
    "service.add", "service.update",
    "service.delete", "service.get",
    "service.attach",
    "settings.user.view", "settings.user.view_all",
    "settings.user.update", "settings.user.update_all",
    "settings.view", "settings.update",
    "debug",
    "notifications.notify", "notifications.notify_all",
    "notifications.list",
    "action.trigger", "action.watch",
    "rules.update", "rules.view",
    "logs.view"
    ]
  end

  def import_data([]) do
    :ok
  end
  def import_data([ h | t ]) do
    {what, value} = h
    Logger.info("Update #{inspect what} with #{inspect value}")
    case what do
      :users -> Enum.map value, &import_user(&1)
      :groups -> Enum.map value, &import_group(&1)
      :password -> Enum.map value, &import_password(&1)
      _ ->
        Logger.error("Dont know how to import #{inspect what} data")
    end

    import_data(t)
  end

  def system_user do
    %{
      email: "system",
      id: -1,
      perms: all_perms
    }
  end


  def import_user(user) do
    u = Repo.get_or_create_and_update(Model.User, [email: user.email], user)

    Enum.map user.groups, fn gn ->
      Repo.get_or_create_and_update(Model.Group, [name: gn], %{name: gn})
      :ok = Auth.Group.user_add gn, user.email, system_user
    end
  end

  def import_group(group) do
    Repo.get_or_create_and_update(Model.Group, [name: group.name], %{name: group.name})
    perms = case group.perms do
      :all_perms -> all_perms
      l          -> l
    end
    Enum.map perms, fn p ->
      :ok = Auth.Group.perm_add group.name, p, system_user
    end
  end

  def import_password({email, password}) do
    {:ok, user} = Auth.User.user_info(email, system_user)
    :ok = Auth.User.Password.password_set(user, password, user)
  end
end

#Serverboards.Repo.transaction fn ->
  Seeds.import_data(data)
#end
