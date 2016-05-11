require Logger

defmodule Serverboards.Auth.RPC do
  alias Serverboards.MOM.RPC
  alias Serverboards.MOM
  alias Serverboards.Auth

  def start_link do
    {:ok, mc} = RPC.MethodCaller.start_link

    # Adds that it needs permissions and user
    Serverboards.Utils.Decorators.permission_method_caller mc

    import RPC.MethodCaller

    ## My own user management
    add_method mc, "auth.set_password", fn [password], context ->
      user = RPC.Context.get(context, :user)
      Logger.info("#{user.email} changes password.")
      Serverboards.Auth.User.Password.set_password(user, password)
    end, [requires_perm: "auth.modify_self", context: true]

    add_method mc, "auth.create_token", fn [], context ->
      user = RPC.Context.get(context, :user)
      Logger.info("#{user.email} created new token.")
      Serverboards.Auth.User.Token.create(user)
    end, [requires_perm: "auth.create_token", context: true]

    add_method mc, "auth.user", fn [], context ->
      user = RPC.Context.get(context, :user)
      user
    end, [context: true]

    ## Group management
    add_method mc, "group.list", fn [], context ->
      Auth.Group.group_list nil
    end, [context: true]
    add_method mc, "group.add", fn [name], context ->
      me = RPC.Context.get(context, :user)
      Auth.Group.group_add name, me
    end, [context: true]
    add_method mc, "group.add_perm", fn [group, code], context ->
      me = RPC.Context.get(context, :user)
      Auth.Group.perm_add group, code, me
    end, [context: true]
    add_method mc, "group.remove_perm", fn [group, code], context ->
      me = RPC.Context.get(context, :user)
      Auth.Group.perm_remove group, code, me
    end, [context: true]
    add_method mc, "group.list_perms", fn [group], context ->
      me = RPC.Context.get(context, :user)
      Auth.Group.perm_list group, me
    end, [context: true]
    add_method mc, "group.add_user", fn [group, new_user], context ->
      me = RPC.Context.get(context, :user)
      Auth.Group.user_add group, new_user, me
    end, [context: true]
    add_method mc, "group.remove_user", fn [group, user], context ->
      me = RPC.Context.get(context, :user)
      Auth.Group.user_remove group, user, me
    end, [context: true]
    add_method mc, "group.list_users", fn [group], context ->
      me = RPC.Context.get(context, :user)
      Auth.Group.user_list group, me
    end, [context: true]


    # Add this method caller once authenticated.
    MOM.Channel.subscribe(:auth_authenticated, fn %{ payload: %{ client: client, user: user}} ->
      RPC.Client.set client, :user, user

      to_serverboards = (RPC.Client.get client, :to_serverboards)

      RPC.add_method_caller to_serverboards, mc

      :ok
    end)

    {:ok, mc}
  end
end
