require Serverboards.Logger
alias Serverboards.Logger

defmodule Serverboards.Rules.Rule do
  alias Serverboards.Rules.Model
  alias Serverboards.Repo

  defstruct [
    uuid: nil,
    is_active: false,
    serverboard: nil,
    service: nil,
    name: nil,
    description: nil,
    trigger: %{},
    actions: []
  ]
  def start_link(rule, options \\ []) do
    trigger = rule.trigger
    actions = rule.actions

    Serverboards.Rules.Trigger.start trigger.trigger, trigger.params, fn params ->
      Logger.debug("Trigger params: #{inspect params}")
      state = params["state"]
      Logger.debug("Trigger state: #{inspect actions} / #{inspect state}")
      action = actions[state]

      Logger.debug("Triggered action #{inspect action}")
      Serverboards.Action.trigger(action.action, action.params, %{ email: "rule/#{rule.uuid}", perms: []})
    end
  end

  def stop(rule) do
    Serverboards.Rules.Trigger.stop rule
  end

  def setup_eventsourcing(es) do
    EventSourcing.Model.subscribe es, :rules, Serverboards.Repo

    EventSourcing.subscribe es, :upsert, fn %{ data: data }, _me ->
      upsert_real(data)
      Serverboards.Event.emit("rules.update", %{ rule: data }, ["rules.view"])
      Logger.debug("Serverboard: #{inspect data.serverboard}")
      if (data.serverboard != nil) do
        Serverboards.Event.emit("rules.update[#{data.serverboard}]", %{ rule: data }, ["rules.view"])
      end
    end
  end

  @doc ~S"""
  Gets a rule as from the database and returns a proper rule struct
  """
  def decorate(model) do
    import Ecto.Query

    service = case model.service_id do
      nil -> nil
      id ->
        Repo.one( from c in Serverboards.Service.Model.Service, where: c.id == ^id, select: c.uuid )
    end
    serverboard = case model.serverboard_id do
      nil -> nil
      id ->
        Repo.one( from c in Serverboards.Serverboard.Model.Serverboard, where: c.id == ^id, select: c.shortname )
    end
    actions = Repo.all(from ac in Model.ActionAtState) |> Enum.map(fn ac ->
      { ac.state, %{
        action: ac.action,
        params: ac.params,
        } }
    end) |> Map.new


    %Serverboards.Rules.Rule{
      uuid: model.uuid,
      is_active: model.is_active,
      serverboard: serverboard,
      service: service,
      name: model.name,
      description: model.description,
      trigger: %{
        trigger: model.trigger,
        params: model.params
      },
      actions: actions
    }
  end

  def upsert(%Serverboards.Rules.Rule{} = data, me) do
    EventSourcing.dispatch(:rules, :upsert, %{ data: data }, me.email)
  end

  defp upsert_real(%Serverboards.Rules.Rule{ uuid: uuid } = data) do
    import Ecto.Query

    uuid = if uuid=="" or uuid==nil do UUID.uuid4 else uuid end
    Logger.debug("UUID is #{inspect uuid}")
    actions = data.actions

    service_id = case data.service do
      nil -> nil
      "" -> nil
      uuid ->
        Repo.one( from c in Serverboards.Service.Model.Service, where: c.uuid == ^uuid, select: c.id )
    end
    serverboard_id = case data.serverboard do
      nil -> nil
      shortname ->
        Repo.one( from c in Serverboards.Serverboard.Model.Serverboard, where: c.shortname == ^shortname, select: c.id )
    end

    Logger.debug("Service id: #{inspect service_id}, serverboards id #{inspect serverboard_id}")

    data = %{
      uuid: uuid,
      is_active: data.is_active,
      service_id: service_id,
      serverboard_id: serverboard_id,
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

    rule = decorate(rule)

    Logger.debug("Decorated rule: #{inspect rule.trigger} / #{inspect rule.is_active}")

    if (rule.is_active and rule.trigger.trigger != nil and rule.trigger.trigger != "") do
      Serverboards.Rules.ensure_rule_active rule
    else
      Serverboards.Rules.ensure_rule_not_active rule
    end

    #Logger.debug("Upserted #{inspect rule}")
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
