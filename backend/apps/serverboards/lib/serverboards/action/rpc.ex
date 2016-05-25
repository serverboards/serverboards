require Logger

defmodule Serverboards.Action.RPC do
  alias MOM.RPC

  def start_link do
    {:ok, mc} = RPC.MethodCaller.start_link

    # Adds that it needs permissions and user
    Serverboards.Utils.Decorators.permission_method_caller mc

    import RPC.MethodCaller

    ## My own user management
    add_method mc, "action.trigger", fn [action, params], context ->
      user = RPC.Context.get context, :user
      Serverboards.Action.trigger action, params, user
    end, [required_perm: "action.trigger", context: true]

    MOM.Channel.subscribe(:auth_authenticated, fn %{ payload: %{ client: client, user: user}} ->
      to_serverboards = (RPC.Client.get client, :to_serverboards)

      RPC.add_method_caller to_serverboards, mc
    end)
    {:ok, mc}
  end
end
