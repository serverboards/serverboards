defmodule Perms do
  def all_perms do
    [
    "auth.modify_self", "auth.modify_any",
    "auth.create_user", "auth.create_token",
    "auth.info_any_user",
    "auth.modify_groups", "auth.manage_groups",
    "plugin",
    "serverboard.add", "serverboard.update",
    "serverboard.delete", "serverboard.info",
    "serverboard.widget.add", "serverboard.widget.update",
    "service.add", "service.update",
    "service.delete", "service.info",
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

  def system_user do
    %{
      email: "system",
      id: -1,
      perms: all_perms
    }
  end

  def do_update do
    Enum.map all_perms, fn p ->
      :ok = Serverboards.Auth.Group.perm_add "admin", p, system_user
    end
  end

end
Perms.do_update
