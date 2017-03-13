require Logger

defmodule Serverboards.Action.RPC do
  alias MOM.RPC

  def start_link do
    {:ok, mc} = RPC.MethodCaller.start_link

    # Adds that it needs permissions and user
    Serverboards.Utils.Decorators.permission_method_caller mc

    import RPC.MethodCaller

    add_method mc, "action.trigger", fn [action, params], context ->
      user = RPC.Context.get context, :user
      perms = user.perms
      if ("action.trigger" in perms) or ("action.trigger[#{action}]" in perms) do
        Serverboards.Action.trigger action, params, user
      else
        {:error, :unknown_method}
      end
    end, context: true

    add_method mc, "action.trigger_wait", fn [action, params], context ->
      user = RPC.Context.get context, :user
      perms = user.perms
      if ("action.trigger" in perms) or ("action.trigger[#{action}]" in perms) do
        Serverboards.Action.trigger_wait action, params, user
      else
        {:error, :unknown_method}
      end
    end, context: true

    add_method mc, "action.catalog", fn q, context ->
      user = RPC.Context.get context, :user
      q = Map.to_list(q) |> Enum.map( fn
        {"traits", v} -> {:traits, v}
        {:traits, v} -> {:traits, v}
      end)
      list = Serverboards.Utils.clean_struct Serverboards.Action.catalog q, user
      {:ok, list}
    end, [required_perm: "action.trigger", context: true]

    add_method mc, "action.ps", fn [], context ->
      user = RPC.Context.get context, :user
      Serverboards.Utils.clean_struct Serverboards.Action.ps user
    end, [required_perm: "action.watch", context: true]

    add_method mc, "action.get", fn
      [uuid], context ->
        user = RPC.Context.get context, :user
        Serverboards.Action.details uuid, user
    end, [required_perm: "action.watch", context: true]

    add_method mc, "action.list", fn
      [], context ->
        user = RPC.Context.get context, :user
        Serverboards.Action.list %{}, user
      options, context ->
        user = RPC.Context.get context, :user
        options = Serverboards.Utils.keys_to_atoms_from_list(options, ~w"start count")
        Serverboards.Action.list options, user
    end, [required_perm: "action.watch", context: true]

    MOM.Channel.subscribe(:auth_authenticated, fn %{ payload: %{ client: client, user: _user}} ->
      MOM.RPC.Client.add_method_caller client, mc
    end)
    {:ok, mc}
  end
end
