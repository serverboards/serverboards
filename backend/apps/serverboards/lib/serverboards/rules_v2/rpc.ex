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

    add_method mc, "rules_v2.update", fn [uuid, changes], context ->
      me = MOM.RPC.Context.get context, :user
      changes = changes
        |> Serverboards.Utils.keys_to_atoms_from_list(~w"name is_active rule description project")
        |> Map.drop(["deleted"])
      Serverboards.RulesV2.Rules.update(uuid, changes, me)
    end, required_perm: "rules.update", context: true

    add_method mc, "rules_v2.list", fn filter ->
      filter = filter |> Serverboards.Utils.keys_to_atoms_from_list(~w"project")
      Serverboards.RulesV2.Rules.list(filter)
    end, required_perm: "rules.view"

    # only difference with update is that delete require a specific permission
    add_method mc, "rules_v2.delete", fn [uuid], context ->
      me = MOM.RPC.Context.get context, :user
      Serverboards.RulesV2.Rules.update(uuid, %{ deleted: true}, me)
    end, required_perm: "rules.delete", context: true


    # Add this method caller once authenticated.
    MOM.Channel.subscribe(:auth_authenticated, fn %{ payload: %{ client: client }} ->
      Logger.warn("Rules V2 RPC subscribed")
      MOM.RPC.Client.add_method_caller client, mc
      :ok
    end)

    {:ok, mc}
  end
end
