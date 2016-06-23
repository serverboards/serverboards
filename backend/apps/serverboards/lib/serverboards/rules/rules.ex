require Serverboards.Logger
alias Serverboards.Logger

defmodule Serverboards.Rules do

  alias Serverboards.Rules.Model
  alias Serverboards.Repo

  defmodule Rule do
    defstruct [
      serverboard: nil,
      service: nil,
      name: nil,
      description: nil,
      trigger: %{},
      actions: []
    ]
  end

  def start_link(rule, options \\ []) do
    trigger = rule.trigger
    actions = rule.actions

    Serverboards.Rules.Trigger.start trigger.id, trigger.params, fn params ->
      Logger.debug("Trigger params: #{inspect params}")
      state = params["state"]
      Logger.debug("Trigger state: #{inspect actions} / #{inspect state}")
      action = actions[state]

      Logger.debug("Triggered action #{inspect action}")
      Serverboards.Action.trigger(action.id, action.params, %{ email: "rule/#{rule.uuid}", perms: []})
    end
  end

  def stop(rule) do
    Serverboards.Rules.Trigger.stop rule
  end

  defp get_actions(rule_id) do
    alias Serverboards.Action
    import Ecto.Query
    Repo.all( from action in Model.ActionAtState,
       where: action.rule_id == ^rule_id,
      select: {
        action.state,  %{
          action: action.action,
          params: action.params
        }
      }
    ) |> Map.new
  end

  def list(filter \\ []) do
    import Ecto.Query
    alias Serverboards.Serverboard.Model.Serverboard
    alias Serverboards.Service.Model.Service

    Logger.debug("All rules: #{inspect Repo.all(from rule in Model.Rule)}")

    q = from rule in Model.Rule,
      left_join: service in Service,
              on: service.id == rule.service_id,
      left_join: serverboard in Serverboard,
              on: serverboard.id == rule.serverboard_id

    q = Enum.reduce(filter, q, fn
      {:serverboard, v}, q ->
        q |> where([_rule, _service, serverboard], serverboard.shortname == ^v )
      end)
    q = q |> select( [rule, service, serverboard], %{
      id: rule.id,
      uuid: rule.uuid,
      name: rule.name,
      description: rule.description,
      serverboard: serverboard.shortname,
      service: service.uuid,
      trigger: %{
        trigger: rule.trigger,
        params: rule.params
      }
    } )

    Repo.all(q)
      |> Enum.map( fn rule ->
        Map.merge(%Serverboards.Rules.Rule{},
          Map.merge(rule, %{
            actions: get_actions( rule.id ),
            trigger: Map.merge(rule.trigger, %{ name: (hd Serverboards.Rules.Trigger.find(id: rule.trigger.trigger )).name })
            }) |> Map.drop([:id])
          )
        end)
  end

  def upsert(uuid, %Serverboards.Rules.Rule{} = data) do
    import Ecto.Query

    uuid = if uuid do uuid else UUID.uuid4 end
    actions = data.actions
    data = %{
      uuid: uuid,
      service_id: nil, #FIXME
      serverboards_id: nil, #FIXME
      name: data.name,
      description: data.description,
      trigger: data.trigger.trigger,
      params: data.trigger.params,
    }

    {:ok, rule} = case Repo.all(from rule in Model.Rule, where: rule.uuid == ^uuid ) do
      [] ->
        insert_rule( data, actions )
      [rule] ->
        update_rule( rule, data, actions )
    end

    Logger.debug("Upserted #{inspect rule}")
  end
  defp insert_rule( data, actions ) do
    {:ok, rule} = Repo.insert(
      Model.Rule.changeset(%Model.Rule{}, data)
    )
    actions |> Map.to_list |> Enum.map(fn {state, action} ->
      action = %{
        rule_id: rule.id,
        state: state,
        action: action.action,
        params: action.params
      }
      Repo.insert(Model.ActionAtState.changeset(%Model.ActionAtState{}, action))
    end)
    {:ok, rule}
  end
  defp update_rule( rule, data, actions ) do
    {:ok, rule} = Repo.update(
      Model.Rule.changeset(rule, data)
    )
    actions |> Map.to_list |> Enum.map(fn {state, action} ->
      action = %{
        rule_id: rule.id,
        state: state,
        action: action.action,
        params: action.params
      }
      upsert_action(rule.id, state, action)
    end)
    {:ok, rule}
  end

  defp upsert_action(rule_id, state, action) do
    import Ecto.Query
    case Repo.all(from a in Model.ActionAtState, where: a.rule_id == ^rule_id and a.state == ^state ) do
      [] ->
        Repo.insert(Model.ActionAtState.changeset(%Model.ActionAtState{}, action))
      [actionm] ->
        Repo.update(Model.ActionAtState.changeset(actionm, action))
    end
  end

end
