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
          project: rule["project"],
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
        Serverboards.Rules.upsert rule, me
        :ok
    end, required_perm: "rules.update", context: true

    add_method mc, "rules.list", fn
      [filter] ->
        key_list = ~w(project uuid service is_active)
        filter_a = Map.to_list(filter)
          |> Serverboards.Utils.keys_to_atoms_from_list(key_list)
        Serverboards.Rules.list filter_a
      [] -> Serverboards.Rules.list
      filter ->
        key_list = ~w(project uuid service is_active)
        filter_a = Map.to_list(filter)
          |> Serverboards.Utils.keys_to_atoms_from_list(key_list)
        Serverboards.Rules.list filter_a
    end, required_perm: "rules.view"

    add_method mc, "rules.get", fn [uuid] ->
      Serverboards.Rules.get uuid
    end, required_perm: "rules.view"

    add_method mc, "rules.trigger", fn
      [uuid, state], context ->
        me = MOM.RPC.Context.get context, :user
        Serverboards.Rules.trigger uuid, state, %{}, me.email
      [uuid, state, other], context ->
        me = MOM.RPC.Context.get context, :user
        Serverboards.Rules.trigger uuid, state, other, me.email
      %{ "id" => uuid, "state" => state} = params, context ->
        me = MOM.RPC.Context.get context, :user
        Serverboards.Rules.trigger uuid, state, Map.drop(params, ["id", "state"]), me.email
    end, required_perm: "rules.trigger", context: true


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
