require Logger

defmodule Serverboards.Auth.RPC do
  alias MOM.RPC
  alias MOM
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
    end, [required_perm: "auth.modify_self", context: true]

    add_method mc, "auth.create_token", fn [], context ->
      user = RPC.Context.get(context, :user)
      Logger.info("#{user.email} created new token.")
      Serverboards.Auth.User.Token.create(user)
    end, [required_perm: "auth.create_token", context: true]

    add_method mc, "auth.user", fn [], context ->
      user = RPC.Context.get(context, :user)
      user
    end, [context: true]

    ## User management
    add_method mc, "user.list", fn [], context ->
      Auth.User.user_list nil
    end, [context: true]
    add_method mc, "user.add", fn attributes, context ->
      me = RPC.Context.get(context, :user)
      Auth.User.user_add %{
        email: attributes["email"],
        first_name: attributes["first_name"],
        last_name: attributes["last_name"],
        is_active: attributes["is_active"]
        }, me
    end, [required_perm: "auth.create_user", context: true]
    add_method mc, "user.update", fn [email, operations], context ->
      me = RPC.Context.get(context, :user)
      Auth.User.user_update email, operations, me
    end, [required_perm: "auth.modify_self", context: true]



    ## Group management
    add_method mc, "group.list", fn [], context ->
      Auth.Group.group_list nil
    end, [context: true]
    add_method mc, "group.add", fn [name], context ->
      me = RPC.Context.get(context, :user)
      Auth.Group.group_add name, me
    end, [required_perm: "auth.modify_groups", context: true]
    add_method mc, "group.remove", fn [name], context ->
      me = RPC.Context.get(context, :user)
      Auth.Group.group_remove name, me
    end, [required_perm: "auth.modify_groups", context: true]
    add_method mc, "group.add_perm", fn [group, code], context ->
      me = RPC.Context.get(context, :user)
      Auth.Group.perm_add group, code, me
    end, [required_perm: "auth.manage_groups", context: true]
    add_method mc, "group.remove_perm", fn [group, code], context ->
      me = RPC.Context.get(context, :user)
      Auth.Group.perm_remove group, code, me
    end, [required_perm: "auth.manage_groups", context: true]
    add_method mc, "group.list_perms", fn [group], context ->
      me = RPC.Context.get(context, :user)
      Auth.Group.perm_list group, me
    end, [required_perm: "auth.manage_groups", context: true]
    add_method mc, "group.add_user", fn [group, new_user], context ->
      me = RPC.Context.get(context, :user)
      Auth.Group.user_add group, new_user, me
    end, [required_perm: "auth.manage_groups", context: true]
    add_method mc, "group.remove_user", fn [group, user], context ->
      me = RPC.Context.get(context, :user)
      Auth.Group.user_remove group, user, me
    end, [required_perm: "auth.manage_groups", context: true]
    add_method mc, "group.list_users", fn [group], context ->
      me = RPC.Context.get(context, :user)
      Auth.Group.user_list group, me
    end, [context: true]


    # Add this method caller once authenticated.
    MOM.Channel.subscribe(:auth_authenticated, fn %{ payload: %{ client: client, user: user}} ->
      RPC.Client.set client, :user, user

      to_serverboards = (RPC.Client.get client, :to_serverboards)

      RPC.add_method_caller to_serverboards, mc

      # subscribe this client to changes on this user
      MOM.Channel.subscribe(:client_events, fn %{ payload: %{ type: type, data: data}} ->
        Logger.info("Get user from #{inspect client}: #{inspect type}")
        user = RPC.Client.get client, :user
        cond do
          type in ["group.perm_added", "group.perm_removed"] ->
            %{ group: group } = data
            if group in user.groups do
              user = Auth.User.user_info user.email, user
              RPC.Client.set client, :user, user

              MOM.Channel.send(:client_events, %MOM.Message{ payload: %{ type: "user.updated", data: %{ user: user} } } )
            end
          type in ["group.user_added","group.user_removed"] ->
            if data.user == user.email do
              user = Auth.User.user_info user.email, user
              RPC.Client.set client, :user, user

              MOM.Channel.send(:client_events, %MOM.Message{ payload: %{ type: "user.updated", data: %{ user: user} } } )
            end
          true ->
            nil
        end
      end)

      :ok
    end)


    {:ok, mc}
  end
end
