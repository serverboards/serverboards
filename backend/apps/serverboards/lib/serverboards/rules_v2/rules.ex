require Logger
alias Serverboards.Repo
alias Serverboards.RulesV2.Model

defmodule Serverboards.RulesV2.Rules do
  @moduledoc ~S"""
  Rules are specified in a tree like structure, that un yaml is represented for
  example as:

  ```yaml
  name: Rule
  description: My description
  rule:
    trigger:
      - id: A
        type: trigger
        trigger: serverboards.core.ssh/remote_exec
        params:
          - command: grep "error" /var/log/mail.log
            period: 5m
            service_id: [UUID]
    actions:
      - id: B
        type: condition
        condition: A.exit_code == 0 and prev.A.exit_code == 1
        then:
          - id: C
            type: action
            action: serverboards.core.actions/notify
            params:
              - to: @user
                subject: No errors now
                body: There are no errors
        else: []
      - id: D
        type: condition
        condition: A.exit_code == 1 and prev.A.exit_code == 0
        then:
          - id: E
            type: action: serverboards.core.actions/notify
            params:
             - to: @user
               subject: Errors at the log
               body: Check it out ASAP
  ```

  """

  def start_ets_table() do
    :ets.new(:rules_rule_id_cache, [:set, :public, :named_table])
  end

  def start_eventsourcing(options \\ []) do
    {:ok, es} = EventSourcing.start_link( [name: Serverboards.RulesV2.EventSourcing] ++ options )

    EventSourcing.subscribe es, :create, fn %{ uuid: uuid, data: data }, me ->
      rule = create_real(uuid, data)
      Serverboards.Event.emit("rules_v2.update", %{ rule: rule }, ["rules.view"])
      if (data.project != nil) do
        Serverboards.Event.emit("rules_v2.update[#{data.project}]", %{ rule: rule }, ["rules.view"])
      end
    end

    {:ok, es}
  end

  def create( %{} = data, me ) do
    uuid = UUID.uuid4
    {:ok, _ } = EventSourcing.dispatch(
      Serverboards.RulesV2.EventSourcing,
      :create,
      %{ uuid: uuid, data: data },
      me.email )
    {:ok, uuid}
  end

  def create_real(uuid, %{} = data) do
    data = Serverboards.Utils.keys_to_atoms_from_list(data, ~w"name description rule is_active deleted")
    data = Map.put(data, :uuid, uuid)
    {:ok, rule} = Repo.insert( Model.Rule.changeset( %Model.Rule{}, data ) )
    {:ok, _} = Repo.insert( Model.RuleState.changeset( %Model.RuleState{}, %{ rule_id: rule.id, state: %{} } ) )
    rule
  end
  def update_real(uuid, %{} = data) do
    case get_rule_id(uuid) do
      nil ->
        Logger.error("Unknown rule #{inspect uuid}")
      rule_id ->
        rule = Repo.get_by( Model.Rule, id: rule_id )
        Repo.update( Model.Rule.changeset( rule, data) )
    end
    :ok
  end

  def set_state_real(uuid, state) when is_map(state) do
    import Ecto.Query
    # Logger.debug("Set state #{inspect uuid} #{inspect state}")
    case get_rule_id( uuid ) do
      nil ->
        Logger.error("Unknown rule to set state to #{inspect uuid}", rule_id: uuid)
        {:error, :unknown_rule}
      rule_id ->
        # Logger.info("Updating rule id #{rule_id}", rule_id: uuid)
        Repo.update_all((
          from r in Model.RuleState,
          where: r.rule_id == ^rule_id,
          update: [set: [state: ^state, updated_at: fragment("NOW()")]]
        ),[])
      :ok
    end
  end
  def delete_real(uuid) do
    update_real(uuid, %{ deleted: true })
    :ok
  end

  def get_rule_id(uuid) when is_binary(uuid) do
    import Ecto.Query

    case :ets.lookup(:rules_rule_id_cache, uuid) do
      [] ->
        Logger.debug("Get rule id for #{inspect uuid}")
        id = Repo.one( from r in Model.Rule, where: r.uuid == ^uuid, select: r.id )
        Logger.debug("it is #{id}")
        if id do
          :ets.insert(:rules_rule_id_cache, {uuid, id})
        end
        id
      [{^uuid, id}] ->
        id
    end
  end

  # Server impl
  def init([]) do
    {:ok, %{}}
  end

end
