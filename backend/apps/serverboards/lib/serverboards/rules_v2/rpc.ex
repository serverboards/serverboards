require Logger

defmodule Serverboards.RulesV2.RPC do
  def start_link(options \\ []) do
    import MOM.RPC.MethodCaller
    {:ok, mc} = MOM.RPC.MethodCaller.start_link options

    # Adds that it needs permissions.
    Serverboards.Utils.Decorators.permission_method_caller mc

    add_method mc, "rules_v2.create", fn data, context ->
      me = MOM.RPC.Context.get context, :user
      Serverboards.RulesV2.Rules.create(data, me)
    end, required_perm: "rules.create", context: true

    add_method mc, "rules_v2.list", fn filter ->
      Serverboards.RulesV2.Rules.list(filter)
    end, required_perm: "rules.view"

    # Add this method caller once authenticated.
    MOM.Channel.subscribe(:auth_authenticated, fn %{ payload: %{ client: client }} ->
      Logger.warn("Rules V2 RPC subscribed")
      MOM.RPC.Client.add_method_caller client, mc
      :ok
    end)

    {:ok, mc}
  end
end
