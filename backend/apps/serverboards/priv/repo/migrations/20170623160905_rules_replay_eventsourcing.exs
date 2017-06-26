require Logger

defmodule Serverboards.Repo.Migrations.RulesReplayEventsourcing do
  use Ecto.Migration

  alias Serverboards.Rules.Model

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
      (from e in Model.RuleV2,
      where: e.uuid == ^uuid), :count, :id
    ) > 0
  end

  # one action, there is no status change
  def parse_actions([action]) do
    parse_actions(action)
  end

  # several, only on status change
  def parse_actions(actions) do
    if Enum.count(actions) == 1 do
      for {status, action} <- actions do # use for for easy deconstructing
        %{
          id: "status",
          type: "action",
          action: action["action"],
          params: action["params"]
        }
      end
    else
      actions = for {status, action}  <- actions do
        %{
           id: status,
           type: "condition",
           condition: "A.state == #{status}",
           then: parse_actions([ %{ status => action} ]),
           else: []
         }
      end

      [
       %{
         id: "status_change",
         type: "condition",
         condition: "A.status != prev.A.status", # only on status change
         then: actions,
         else: []
       }
     ]
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
          params: data["trigger"]["params"]
        },
        actions: parse_actions(data["actions"])
      }
    }

    if exists_uuid?(uuid) do
      Serverboards.Rules.RulesV2.update_real( uuid, data_v2 )
    else
      Serverboards.Rules.RulesV2.insert_real( uuid, data_v2 )
    end
  end

  def set_state(r, state) do
    uuid = r.data["rule"]
    case Serverboards.Rules.RulesV2.get_rule_id( uuid ) do
      nil ->
        case  :ets.lookup(state, :last) do
          [{:last, wrong_uuid}] ->
            Serverboards.Rules.RulesV2.update_real( wrong_uuid, %{ uuid: uuid })
            Logger.warn("Fixed rule UUID from #{inspect wrong_uuid} to #{inspect uuid}")
            :ets.delete(state, :last)
          _ -> :none
        end
      _ -> :ok
    end

    Serverboards.Rules.RulesV2.set_state_real( uuid, %{ A: %{ state: r.data["state"] }})
  end

  def delete(%{ data: %{ "uuid" => nil }}, _state), do: false
  def delete(r, _state) when is_map(r) do
    Logger.debug("Delete #{inspect r}")
    Serverboards.Rules.RulesV2.delete_real( r.data["uuid"] )
  end

  def up do
    state = :ets.new(:update_state, [:set, :private])

    Serverboards.Rules.RulesV2.start_link()
    for r <- all_rules_events() do
      case r.type do
        "upsert" -> upsert( r, state )
        "set_state" -> set_state( r, state )
        "delete" -> delete( r, state )
      end
    end

    :ets.delete(state)

    :error == :ok
  end

  def down do
    import Ecto.Query

    Serverboards.Repo.delete_all( Serverboards.Rules.Model.RuleV2State )
    Serverboards.Repo.delete_all( Serverboards.Rules.Model.RuleV2 )
    :ok
  end
end
