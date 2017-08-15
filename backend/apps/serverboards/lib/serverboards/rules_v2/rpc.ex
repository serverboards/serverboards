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
        |> Map.take(~w"name is_active rule description project"a)
      Serverboards.RulesV2.Rules.update(uuid, changes, me)
    end, required_perm: "rules.update", context: true

    add_method mc, "rules_v2.list", fn filter when is_map(filter) ->
      filter = filter |> Serverboards.Utils.keys_to_atoms_from_list(~w"project")
      Serverboards.RulesV2.Rules.list(filter)
    end, required_perm: "rules.view"

    add_method mc, "rules_v2.get", fn [uuid] ->
      case Serverboards.RulesV2.Rules.get(uuid) do
        nil -> {:error, :not_found}
        rule -> rule
      end
    end, required_perm: "rules.view"

    # only difference with update is that delete require a specific permission
    add_method mc, "rules_v2.delete", fn [uuid], context ->
      me = MOM.RPC.Context.get context, :user
      Serverboards.RulesV2.Rules.update(uuid, %{ deleted: true}, me)
    end, required_perm: "rules.delete", context: true


    # both v1 and v2
    add_method mc, "rules.catalog", fn
      [filter] -> Serverboards.Rules.Trigger.find filter
      [] -> Serverboards.Rules.Trigger.find
      %{} -> Serverboards.Rules.Trigger.find
    end, required_perm: "rules.view"

    setup_rpc_v1(mc)

    # Add this method caller once authenticated.
    MOM.Channel.subscribe(:auth_authenticated, fn %{ payload: %{ client: client }} ->
      Logger.warn("Rules V2 RPC subscribed")
      MOM.RPC.Client.add_method_caller client, mc
      :ok
    end)

    {:ok, mc}
  end


  def setup_rpc_v1(mc) do
    import MOM.RPC.MethodCaller
    add_method mc, "rules.list", fn
      [filter] ->
        if filter["service"]!=nil or filter["trigger"]!=nil do
          Logger.warn("Compatibility problem! V2 rules do not support this filter yet!")
        end
        key_list = ~w(project uuid is_active)
        filter_a = Map.to_list(filter)
          |> Serverboards.Utils.keys_to_atoms_from_list(key_list)
          |> Enum.into(%{})
        Serverboards.RulesV2.Rules.list(filter_a)
          |> Enum.map(&transform_rule_to_v1/1)
      [] -> Serverboards.Rules.list
      filter ->
        if filter["service"]!=nil or filter["trigger"]!=nil do
          Logger.warn("Compatibility problem! V2 rules do not support this filter yet!")
        end
        key_list = ~w(project uuid is_active)
        filter_a = Map.to_list(filter)
          |> Serverboards.Utils.keys_to_atoms_from_list(key_list)
          |> Enum.into(%{})
        Serverboards.RulesV2.Rules.list(filter_a)
          |> Enum.map(&transform_rule_to_v1/1)
    end, required_perm: "rules.view"

    add_method mc, "rules.get", fn [uuid] ->
      Serverboards.RulesV2.Rules.get(uuid) |> transform_rule_to_v1
    end, required_perm: "rules.view"
  end

  def transform_rule_to_v1(rule) do
    # Logger.debug("Transform #{inspect rule}\n    #{inspect rule.rule["actions"]}")
    state = Serverboards.RulesV2.Rules.get_state( rule.uuid )
    last_state = get_deep( state, ["A","state"], nil)
    actions = get_actions( rule.rule["actions"] )

    res = %{
      uuid: rule.uuid,
      name: rule.name || "",
      is_active: rule.is_active,
      description: rule.description || "",
      from_template: rule.from_template,
      trigger: %{
        trigger: rule.rule["when"]["trigger"],
        params: rule.rule["when"]["params"]
        },
      project: rule.project,
      last_state: last_state,
      # FIXME more data transforms
      service: find_deep( rule.rule, "service_id", nil ),
      actions: actions,
    }
    # Logger.debug("-->> #{inspect res}")
    res
  end

  def get_actions([]), do: %{}
  def get_actions([action | rest]) do
    # Logger.debug("Get actions from #{inspect action}")
    actions = if action["type"] == "condition" do
      Map.merge(
        get_actions(action["then"]),
        get_actions(action["else"])
        )
    else
      Map.put(%{}, action["id"], %{ params: action["params"], action: action["action"] })
    end
    Map.merge(actions, get_actions(rest))
  end

  # traverses the map using the list as routes to follow, or return default
  def get_deep( map, [], _default), do: map
  def get_deep( map, _, default) when map == %{}, do: default
  def get_deep( map, [head | rest], default) do
    case Map.get(map, head, nil) do
      m when is_map(m) ->
        get_deep(m, rest, default)
      nil -> default
      other -> other # could not get to the end of the list, return what I have.
    end
  end

  # finds any key that matches and returns the value, to return for example a related service
  def find_deep(map, key) do
    # Logger.debug("Find deep #{inspect map} #{inspect key}??")
    Enum.find_value(map, nil, fn
      {^key, v} ->
        # Logger.debug("Got it! #{inspect v}")
        v
      {_k, v} when is_map(v) ->
        # Logger.debug("Go deeper: #{inspect v} find #{inspect key}")
        find_deep(v, key)
      {k, v} ->
        # Logger.debug("Bad path: #{inspect k}/#{inspect v}")
        false
    end)
  end

  def find_deep(map, key, default) do
    res = case find_deep(map, key) do
      nil -> default
      other -> other
    end
    # Logger.debug("Find deep #{inspect map} #{inspect key} -> #{inspect res}")
    res
  end

end
