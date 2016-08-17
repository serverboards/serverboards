require Logger

defmodule Serverboards.Rules.RPC do
  def start_link(options \\ []) do
    import MOM.RPC.MethodCaller
    {:ok, mc} = MOM.RPC.MethodCaller.start_link options

    # Adds that it needs permissions.
    Serverboards.Utils.Decorators.permission_method_caller mc

    add_method mc, "rules.update", fn
      %{} = rule, context ->
        rule = %Serverboards.Rules.Rule{
          uuid: rule["uuid"],
          is_active: rule["is_active"],
          serverboard: rule["serverboard"],
          service: rule["service"],
          name: rule["name"],
          description: rule["description"],
          trigger: %{
            trigger: rule["trigger"]["trigger"],
            params: rule["trigger"]["params"]
          },
          actions: Enum.map(rule["actions"], fn {state, ac} ->
            {state, %{
              action: ac["action"],
              params: ac["params"]
            } }
          end) |> Map.new
        }
        #Logger.info("Rule #{inspect rule}")
        me = MOM.RPC.Context.get context, :user
        Serverboards.Rules.Rule.upsert rule, me
        :ok
    end, required_perm: "rules.update", context: true

    add_method mc, "rules.list", fn
      [filter] -> Serverboards.Rules.list filter
      [] -> Serverboards.Rules.list
      filter -> Serverboards.Rules.list filter
    end, required_perm: "rules.view"

    add_method mc, "rules.catalog", fn
      [filter] -> Serverboards.Rules.Trigger.find filter
      [] -> Serverboards.Rules.Trigger.find
      %{} -> Serverboards.Rules.Trigger.find
    end, required_perm: "rules.view"

    # Add this method caller once authenticated.
    MOM.Channel.subscribe(:auth_authenticated, fn %{ payload: %{ client: client }} ->
      MOM.RPC.Client.add_method_caller client, mc
      :ok
    end)

    {:ok, mc}
  end
end
