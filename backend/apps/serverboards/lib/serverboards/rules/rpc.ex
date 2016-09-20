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
          is_active: Map.get(rule, "is_active", false),
          serverboard: rule["serverboard"],
          service: rule["service"],
          name: rule["name"],
          description: rule["description"],
          trigger: %{
            trigger: rule["trigger"]["trigger"],
            params: rule["trigger"]["params"]
          },
          actions: (Enum.map(rule["actions"], fn {state, ac} ->
            {state, %{
              action: ac["action"],
              params: ac["params"]
            } }
          end) |> Map.new),
          from_template: rule["from_template"]
        }
        #Logger.info("Rule #{inspect rule}")
        me = MOM.RPC.Context.get context, :user
        Serverboards.Rules.Rule.upsert rule, me
        :ok
    end, required_perm: "rules.update", context: true

    add_method mc, "rules.list", fn
      [filter] ->
        key_list = ~w(serverboard uuid service is_active)
        filter_a = Map.to_list(filter)
          |> Serverboards.Utils.keys_to_atoms_from_list(key_list)
        Serverboards.Rules.list filter_a
      [] -> Serverboards.Rules.list
      filter ->
        key_list = ~w(serverboard uuid service is_active)
        filter_a = Map.to_list(filter)
          |> Serverboards.Utils.keys_to_atoms_from_list(key_list)
        Serverboards.Rules.list filter_a
    end, required_perm: "rules.view"

    add_method mc, "rules.templates", fn %{} = filter ->
      key_list = ~w(id trait traits type)
      filter_a = Map.to_list(filter)
        |> Serverboards.Utils.keys_to_atoms_from_list(key_list)

      {:ok, Serverboards.Rules.rule_templates( filter_a ) }
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
