require Logger

defmodule Serverboards.Auth.RPC do
  alias MOM.RPC
  alias Serverboards.Auth

  def start_link(_args \\ [], options \\ []) do
    {:ok, mc} = RPC.MethodCaller.start_link [name: __MODULE__] ++ options

    # Adds that it needs permissions and user
    Serverboards.Utils.Decorators.permission_method_caller mc

    import RPC.MethodCaller

    ## My own user management
    add_method mc, "auth.set_password", fn [current, password], context ->
      user = RPC.Context.get(context, :user)
      case (Serverboards.Auth.auth(%{"type" => "basic", "email" => user.email, "password" => current})) do
        {:ok, user} ->
          Logger.info("#{user.email} changes password.", user: user.email)

          Serverboards.Auth.User.Password.password_set(user, password, user)
        {:error, other} ->
          Logger.error("#{user.email} try to change password, no match previous.", user: user.email)
          {:error, :invalid_password}
      end
    end, [required_perm: "auth.modify_self", context: true]

    add_method mc, "auth.create_token", fn [], context ->
      user = RPC.Context.get(context, :user)
      Logger.info("#{user.email} created new token.")
      Serverboards.Auth.User.Token.create(user)
    end, [required_perm: "auth.create_token", context: true]

    add_method mc, "auth.refresh_token", fn [token], context ->
      user = RPC.Context.get(context, :user)
      Logger.info("#{user.email} refreshes a token.", user: user, token: token)
      Serverboards.Auth.User.Token.refresh(token, user.email)
    end, [required_perm: "auth.create_token", context: true]


    add_method mc, "auth.user", fn [], context ->
      user = RPC.Context.get(context, :user)
      user
    end, [context: true]

    ## User management
    add_method mc, "user.list", fn [] ->
      Auth.User.user_list nil
    end, required_perm: "auth.list"
    add_method mc, "user.add", fn attributes, context ->
      me = RPC.Context.get(context, :user)
      Auth.User.user_add %{
        email: attributes["email"],
        name: attributes["name"],
        is_active: attributes["is_active"]
        }, me
    end, [required_perm: "auth.create_user", context: true]
    add_method mc, "user.update", fn [email, operations], context ->
      me = RPC.Context.get(context, :user)
      Auth.User.user_update email, operations, me
    end, [required_perm: "auth.modify_self", context: true]

    ## Group management
    add_method mc, "group.list", fn [] ->
      Auth.Group.group_list nil
    end, required_perm: "auth.list"
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
    end, [context: true, required_perm: "auth.list"]

    # permission list
    add_method mc, "perm.list", fn [] ->
      {:ok, Auth.Permission.perm_list}
    end, [required_perm: "auth.manage_groups"]

    add_method mc, "auth.reauth", fn %{ "uuid" => uuid, "data" => data }, context ->
      Serverboards.Auth.Reauth.reauth(
        RPC.Context.get(context, :reauth),
        uuid, data
      )
    end, [context: true]

    # reauth test
    add_method mc, "auth.test_reauth", fn [], context->
      reauth_map = Serverboards.Auth.Reauth.request_reauth(
        RPC.Context.get(context, :reauth),
        fn ->
          {:ok, :reauth_success}
      end)
      {:error, reauth_map}
    end, [context: true, required_perm: "debug"]


    # Add this method caller once authenticated.
    MOM.Channel.subscribe(:auth_authenticated, fn %{ payload: %{ client: client, user: user}} ->
      MOM.RPC.Client.add_method_caller client, mc

      # subscribe this client to changes on this user
      MOM.Channel.subscribe(:client_events, fn %{ payload: %{ type: type, data: data}} ->
        cond do
          type in ["group.perm_added", "group.perm_removed"] ->
            user = RPC.Client.get client, :user
            %{ group: group } = data
            if group in user.groups do
              user = Auth.User.user_info user.email, user
              RPC.Client.set client, :user, user

              Serverboards.Event.emit("user.updated", %{ user: user}, ["auth.modify_any"])
              Serverboards.Event.emit("user.updated", %{ user: user}, %{ user: user })
            end
          type in ["group.user_added","group.user_removed"] ->
            user = RPC.Client.get client, :user
            if data.email == user.email do
              user = Auth.User.user_info user.email, user
              RPC.Client.set client, :user, user

              Serverboards.Event.emit("user.updated", %{ user: user}, ["auth.modify_any"])
              Serverboards.Event.emit("user.updated", %{ user: user}, %{ user: user })
            end
          true ->
            nil
        end
        :ok
      end)

      {:ok, reauth_pid} = Serverboards.Auth.Reauth.start_link
      RPC.Client.set client, :reauth, reauth_pid

      :ok
    end)

    {:ok, mc}
  end
end
