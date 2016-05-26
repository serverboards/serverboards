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
      Serverboards.Action.trigger action, params, user
    end, [required_perm: "action.trigger", context: true]

    add_method mc, "action.filter", fn q, context ->
      user = RPC.Context.get context, :user
      q = Map.to_list(q) |> Enum.map( fn
        {"traits", v} -> {:traits, v}
        {:traits, v} -> {:traits, v}
      end)
      list = Serverboards.Utils.clean_struct Serverboards.Action.filter q, user
      {:ok, list}
    end, [required_perm: "action.trigger", context: true]

    add_method mc, "action.ps", fn [], context ->
      user = RPC.Context.get context, :user
      Serverboards.Utils.clean_struct Serverboards.Action.ps user
    end, [required_perm: "action.watch", context: true]

    MOM.Channel.subscribe(:auth_authenticated, fn %{ payload: %{ client: client, user: user}} ->
      to_serverboards = (RPC.Client.get client, :to_serverboards)

      RPC.add_method_caller to_serverboards, mc
    end)
    {:ok, mc}
  end
end
