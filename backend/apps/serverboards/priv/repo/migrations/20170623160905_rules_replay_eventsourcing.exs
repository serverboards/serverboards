require Logger

defmodule Serverboards.Repo.Migrations.RulesReplayEventsourcing do
  use Ecto.Migration

  alias Serverboards.RulesV2.Model

  defp all_rules_events do
    import Ecto.Query
    Serverboards.Repo.all(
        from e in EventSourcing.Model.EventStream,
        order_by: [asc: e.inserted_at],
        where: e.store == "rules"
        # select: [ e.id, e.type, e.store ]
      )
  end

  defp exists_uuid?(uuid) do
    import Ecto.Query
    Serverboards.Repo.aggregate(
      (from e in Model.Rule,
      where: e.uuid == ^uuid), :count, :id
    ) > 0
  end

  def parse_actions(actions), do: parse_actions(actions, "status")

  # one action, there is no status change
  def parse_actions([action], default_id) do
    parse_actions(action, default_id)
  end

  # several, only on status change
  def parse_actions(actions, default_id) do
    if Enum.count(actions) == 1 do
      for {status, action} <- actions do # use for for easy deconstructing
        %{
          id: default_id,
          type: "action",
          action: action["action"],
          params: action["params"]
        }
      end
    else
      actions = for {status, action}  <- actions do
        %{
           id: "#{status}-check",
           type: "condition",
           condition: "changes.A.state == '#{status}'",
           then: parse_actions([ %{ status => action} ], status),
           else: []
         }
      end
      
      actions
    end
  end

  def upsert(r, state) do
    Logger.debug("Upsert #{inspect r}")

    uuid = with uuid when is_binary(uuid) <- r.data["uuid"]  do
       uuid
    else
      nil ->
        uuid = UUID.uuid4
        Logger.warn("I had to figure out a new UUID for the rule. state may not work! #{inspect uuid}")
        # I save it was the last created rule, next that will set_state and has not been added, will change the rule uuid to the expected one
        :ets.insert(state, {:last, uuid})
        uuid
    end

    data = r.data["data"]

    Logger.debug("#{inspect r}")
    trigger_params = if data["service"] do
      # Logger.warn("Set trigger params service: #{inspect data["service"]}")
      data["trigger"]["params"]
        |> Map.put("service_id", data["service"])
    else
      data["trigger"]["params"]
    end

    actions = parse_actions(data["actions"])

    data_v2 = %{
      uuid: data["uuid"],
      name: data["name"],
      description: data["description"],
      is_active: data["is_active"],
      deleted: false,
      state: %{},
      from_template: data["from_template"],
      project: data["project"],
      rule: %{
        when: %{
          name: "A",
          type: "trigger",
          trigger: data["trigger"]["trigger"],
          params: trigger_params
        },
        actions: actions
      }
    }

    if exists_uuid?(uuid) do
      Serverboards.RulesV2.Rules.update_real( uuid, data_v2, start: false )
    else
      Serverboards.RulesV2.Rules.create_real( uuid, data_v2, start: false )
    end
  end

  def set_state(r, state) do
    uuid = r.data["rule"]
    case Serverboards.RulesV2.Rules.get_rule_id( uuid ) do
      nil ->
        case  :ets.lookup(state, :last) do
          [{:last, wrong_uuid}] ->
            Serverboards.RulesV2.Rules.update_real( wrong_uuid, %{ uuid: uuid }, start: false)
            Logger.warn("Fixed rule UUID from #{inspect wrong_uuid} to #{inspect uuid}")
            :ets.delete(state, :last)
          _ -> :none
        end
      _ -> :ok
    end

    :ets.insert(state, {uuid, r.data["state"]})
  end

  def set_state_final(state) do
    :ets.delete(state, :last)
    for_all_ets(state, fn uuid, state ->
      Logger.debug("Fix state for #{inspect uuid} -> #{inspect state}")
      Serverboards.RulesV2.Rules.set_state_real( uuid, %{ A: %{ state: state }})
    end)
  end

  def for_all_ets(state, f) do
    first = :ets.first(state)
    for_all_ets(state, first, f)
  end
  def for_all_ets(state, :"$end_of_table", f) do
    :ok
  end
  def for_all_ets(state, current, f) do
    # Logger.debug("for all ets #{inspect current}")
    [{k,v}] = :ets.lookup(state, current)
    f.( k, v )
    for_all_ets(state, :ets.next(state, current), f)
  end

  def delete(%{ data: %{ "uuid" => nil }}, _state), do: false
  def delete(r, _state) when is_map(r) do
    Logger.debug("Delete #{inspect r}")
    Serverboards.RulesV2.Rules.delete_real( r.data["uuid"], start: false )
  end

  def up do
    state = :ets.new(:update_state, [:set, :private])

    Serverboards.RulesV2.Rules.start_ets_table()
    Registry.start_link(:unique, :rules_registry)

    for r <- all_rules_events() do
      case r.type do
        "upsert" -> upsert( r, state )
        "set_state" -> set_state( r, state )
        "delete" -> delete( r, state )
      end
    end

    set_state_final(state)

    :ets.delete(state)

    # :fail = :ok
  end

  def down() do
    import Ecto.Query
    #
    Serverboards.Repo.delete_all( Serverboards.RulesV2.Model.RuleState )
    Serverboards.Repo.delete_all( Serverboards.RulesV2.Model.Rule )
    :ok
  end
end
