require Logger

defmodule Serverboards.Serverboard.RPC do
  alias Serverboards.MOM.RPC
  alias Serverboards.MOM.RPC.Context
  alias Serverboards.MOM

  def start_link(options \\ []) do
    {:ok, mc} = RPC.MethodCaller.start_link options
    import Serverboards.Serverboard

    # Adds that it needs permissions.
    Serverboards.Utils.Decorators.permission_method_caller mc

    # Serverboards
    RPC.MethodCaller.add_method mc, "serverboard.add", fn [serverboardname, options], context ->
      serverboard_add serverboardname, options, Context.get(context, :user)
    end, [requires_perm: "serverboard.add", context: true]

    RPC.MethodCaller.add_method mc, "serverboard.delete", fn [serverboard_id], context ->
      serverboard_delete serverboard_id, Context.get(context, :user)
    end, [requires_perm: "serverboard.add", context: true]

    RPC.MethodCaller.add_method mc, "serverboard.update", fn
      [serverboard_id, operations], context ->
        serverboard_update serverboard_id, operations, Context.get(context, :user)
      end, [requires_perm: "serverboard.update", context: true]

    RPC.MethodCaller.add_method mc, "serverboard.info", fn [serverboard_id], context ->
      {:ok, serverboard} = serverboard_info serverboard_id, Context.get(context, :user)
      {:ok, Serverboards.Utils.clean_struct serverboard}
    end, [requires_perm: "serverboard.info", context: true]

    RPC.MethodCaller.add_method mc, "serverboard.list", fn [], context ->
      {:ok, serverboards} = serverboard_list Context.get(context, :user)
      Enum.map serverboards, &Serverboards.Utils.clean_struct(&1)
    end, [requires_perm: "serverboard.info", context: true]

    # Add this method caller once authenticated.
    MOM.Channel.subscribe(:auth_authenticated, fn %{ payload: %{ client: client, user: user}} ->
      RPC.add_method_caller (RPC.Client.get client, :to_serverboards), mc
      :ok
    end)

    {:ok, mc}
  end
end
