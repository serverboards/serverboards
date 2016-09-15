require Logger

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
    actions: [],
    from_template: nil # original template rule
  ]
  def start(rule, _options \\ []) do
    #Logger.debug("#{inspect rule}")
    trigger = rule.trigger
    actions = rule.actions

    # def params are gotten from service, and overwritten later.
    # this makes it easy to fill only required fields at UI and later
    # use service data to complete it, for example to change labels on the
    # selected service
    # Also if the service is modified then just restarting the rule make
    # it up to date with the new data. TODO
    default_params = if rule.service != nil do
      Serverboards.Service.service_config(rule.service)
        |> Map.put(:service, rule.service)
    else
      %{ service: nil }
    end

    params = Map.merge(trigger.params, default_params)
    Logger.info("Start rule with trigger checker #{inspect trigger.trigger} #{rule.uuid}", rule: rule, params: params)

    Serverboards.Rules.Trigger.start trigger.trigger, params, fn params ->
      state = params["state"]
      action = actions[state]

      params = Map.merge(action.params, default_params)

      Logger.info("Triggered action #{inspect action}", rule: rule, params: params, action: action)
      Serverboards.Action.trigger(action.action, params, %{ email: "rule/#{rule.uuid}", perms: []})
    end
  end

  def stop(rule) do
    Logger.info("Stop rule with trigger #{rule}", rule: rule)
    Serverboards.Rules.Trigger.stop rule
  end

  def setup_eventsourcing(es) do
    EventSourcing.Model.subscribe es, :rules, Serverboards.Repo

    EventSourcing.subscribe es, :upsert, fn %{ data: data }, _me ->
      rule = upsert_real(data)
      Serverboards.Event.emit("rules.update", %{ rule: rule }, ["rules.view"])
      Logger.debug("Serverboard: #{inspect data.serverboard}")
      if (data.serverboard != nil) do
        Serverboards.Event.emit("rules.update[#{data.serverboard}]", %{ rule: rule }, ["rules.view"])
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
      from_template: model.from_template,
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
    #Logger.debug("UUID is #{inspect uuid}")
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
      from_template: data.from_template
    }

    {:ok, rulem} = case Repo.all(from rule in Model.Rule, where: rule.uuid == ^uuid ) do
      [] ->
        insert_rule( data, actions )
      [rule] ->
        update_rule( rule, data, actions )
    end

    rule = decorate(rulem)

    #Logger.debug("Decorated rule: #{inspect rule.trigger} / #{inspect rule.is_active}")

    rule = if (rule.is_active and rule.trigger.trigger != nil and rule.trigger.trigger != "") do
      #Logger.debug("Ensure active")
      case Serverboards.Rules.restart_rule(rule) do
        :error ->
          Logger.error("Cant ensure rule is started, disabling it.", rule: rule)
          Serverboards.Rules.ensure_rule_not_active rule
          Repo.update(
            Model.Rule.changeset(rulem, %{ is_active: false })
          )
          %{ rule | is_active: false }
        :ok ->
          rule
      end
    else
      #Logger.debug("Ensure NOT active")
      Serverboards.Rules.ensure_rule_not_active rule
      rule
    end

    rule
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
