require Logger

defmodule Serverboards.Notifications.RPC do
  def start_link(options \\ []) do
    alias MOM.RPC
    import RPC.MethodCaller
    alias Serverboards.Notifications

    {:ok, mc} = RPC.MethodCaller.start_link options

    # Adds that it needs permissions and user
    Serverboards.Utils.Decorators.permission_method_caller mc

    add_method mc, "notifications.catalog", fn _ ->
      {:ok, Notifications.catalog}
    end

    add_method mc, "notifications.config", fn
      [email], context ->
        me = RPC.Context.get(context, :user)
        if (me.email == email) or ("settings.user.view_all" in me.perms) do
          Notifications.config_get email
        else
          {:error, :not_allowed}
        end
      [email, channel], context ->
        me = RPC.Context.get(context, :user)
        if (me.email == email) or ("settings.user.view_all" in me.perms) do
          Notifications.config_get email, channel
        else
          {:error, :not_allowed}
        end
    end, context: true, required_perm: "settings.user.view"

    add_method mc, "notifications.config_update",
                  fn %{ "email" => email, "channel" => channel,
                        "is_active" => is_active, "config" => config}, context ->
      me = RPC.Context.get(context, :user)
      if (me.email == email) or ("settings.user.update_all" in me.perms) do
        Notifications.config_update email, channel, config, is_active, me
      else
        {:error, :not_allowed}
      end
    end, context: true, required_perm: "settings.user.update"

    add_method mc, "notifications.notify",
        fn %{ "email" => email, "subject" => subject, "body" => body } = params, context ->
      me = RPC.Context.get(context, :user)
      if (me.email == email) or ("notifications.notify_all" in me.perms) do
        Notifications.notify email, subject, body, Map.get(params, "extra", []), me
      else
        {:error, :not_allowed}
      end
    end, context: true, required_perm: "notifications.notify"

    add_method mc, "notifications.list", fn filter, context ->
      me = RPC.Context.get(context, :user)
      filter=Serverboards.Utils.keys_to_atoms_from_list(filter, ~w"count start tags")
      Notifications.InApp.list(filter, me)
    end, context: true, required_perm: "notifications.list"

    add_method mc, "notifications.details", fn [id], context ->
      me = RPC.Context.get(context, :user)
      Notifications.InApp.details(id, me)
    end, context: true, required_perm: "notifications.list"

    add_method mc, "notifications.update", fn %{ "id" => id, "tags" => tags}, context ->
      me = RPC.Context.get(context, :user)
      Notifications.InApp.update(id, %{ tags: tags}, me)
      :ok
    end, context: true, required_perm: "notifications.list"
    # Add this method caller once authenticated.
    MOM.Channel.subscribe(:auth_authenticated, fn %{ payload: %{ client: client, user: _user}} ->
      MOM.RPC.Client.add_method_caller client, mc
    end)

    {:ok, mc}
  end
end
