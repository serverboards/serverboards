require Logger


defmodule Serverboards.Settings.RPC do
  alias MOM.RPC
  alias MOM.RPC.Context
  alias MOM

  def start_link(options \\ []) do
    {:ok, mc} = RPC.MethodCaller.start_link options
    import Serverboards.Settings

    # Adds that it needs permissions.
    Serverboards.Utils.Decorators.permission_method_caller mc

    RPC.MethodCaller.add_method mc, "settings.all", fn [], context ->
      all_settings Context.get(context, :user)
    end, [required_perm: "settings.view", context: true]

    RPC.MethodCaller.add_method mc, "settings.update", fn
      [section, changes], context ->
        update section, changes, Context.get(context, :user)
      [section, key, nil], context ->
        changes = Serverboards.Settings.get(section, %{})
          |> Map.drop([key])
        update section, changes, Context.get(context, :user)
      [section, key, value], context ->
        changes = Serverboards.Settings.get(section, %{})
          |> Map.put(key, value)
        update section, changes, Context.get(context, :user)
    end, [required_perm: "settings.update", context: true]

    RPC.MethodCaller.add_method mc, "settings.get", fn
      [section], context ->
        perms = (RPC.Context.get context, :user).perms
        can_view = (
          ("settings.view" in perms) or
          ("settings.view[#{section}]" in perms)
          )
        if can_view do
          Serverboards.Settings.get section
        else
          Logger.debug("Try to access settings #{section}, with permissions #{inspect perms}")
          {:error, :not_allowed}
        end
      [section, defval], context ->
        perms = (RPC.Context.get context, :user).perms
        can_view = (
          ("settings.view" in perms) or
          ("settings.view[#{section}]" in perms)
          )
        if can_view do
          Serverboards.Settings.get section, defval
        else
          Logger.debug("Try to access settings #{section}, with permissions #{inspect perms}")
          {:error, :not_allowed}
        end
    end, [context: true]

    RPC.MethodCaller.add_method mc, "settings.user.get", fn
      [section], context ->
        user = (RPC.Context.get context, :user)
        can_view = ("settings.user.view" in user.perms)
        if can_view do
          Serverboards.Settings.user_get user.email, section
        else
          {:error, :not_allowed}
        end
      [user, section], context ->
        me = (RPC.Context.get context, :user)
        can_view = ("settings.user.view_all" in me.perms)
        if can_view do
          Serverboards.Settings.user_get user, section
        else
          {:error, :not_allowed}
        end
    end, [context: true]

    RPC.MethodCaller.add_method mc, "settings.user.set", fn
      [section, data], context ->
        user = (RPC.Context.get context, :user)
        can_update = ("settings.user.update" in user.perms)
        if can_update do
          Serverboards.Settings.user_update user.email, section, data, user.email
        else
          {:error, :not_allowed}
        end
      [user, section, data], context ->
        me = (RPC.Context.get context, :user)
        can_update = ("settings.user.update_all" in me.perms)
        if can_update do
          Serverboards.Settings.user_update user, section, data, me.email
        else
          {:error, :not_allowed}
        end
    end, [context: true]


    # Add this method caller once authenticated.
    MOM.Channel.subscribe(:auth_authenticated, fn %{ payload: %{ client: client }} ->
      #Logger.debug("New client, has perms: #{inspect (RPC.Client.get client, :user)}")
      RPC.Client.add_method_caller client, mc
      :ok
    end)

    {:ok, mc}
  end
end
