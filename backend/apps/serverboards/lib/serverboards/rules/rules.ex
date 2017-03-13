require Logger

defmodule Serverboards.Rules do
  @moduledoc """
  Related functions to rule management: start, stop, update values...

  And properly stored in the database.
  """

  alias Serverboards.Rules.Model
  alias Serverboards.Rules
  alias Serverboards.Repo
  use GenServer

  def start_link(options) do
    import Supervisor.Spec

    children=[
      worker(Serverboards.Rules.RPC, [[name: Serverboards.Rules.RPC]]),
      worker(GenServer, [__MODULE__, :ok, [name: Serverboards.Rules] ++ options] ),
      worker(__MODULE__, [], function: :start_eventsourcing),
      worker(Serverboards.ProcessRegistry, [[name: Serverboards.Rules.Registry]]),
      supervisor(Serverboards.Rules.Supervisor,[])
    ]

    Supervisor.start_link(children, strategy: :one_for_one, name: Serverboards.Rules.Supervisor)
  end

  def start_eventsourcing(options \\ []) do
    {:ok, es} = EventSourcing.start_link( [name: Serverboards.Rules.EventSourcing] ++ options )
    EventSourcing.Model.subscribe es, :rules, Serverboards.Repo

    EventSourcing.subscribe es, :upsert, fn %{ data: data }, _me ->
      rule = upsert_real(data)
      Serverboards.Event.emit("rules.update", %{ rule: rule }, ["rules.view"])
      if (data.project != nil) do
        Serverboards.Event.emit("rules.update[#{data.project}]", %{ rule: rule }, ["rules.view"])
      end
    end
    EventSourcing.subscribe es, :set_state, fn data, _me ->
      import Ecto.Query, only: [from: 2]
      rule = Repo.one( from u in Model.Rule, where: u.uuid == ^data.rule )
      {:ok, rule} = Repo.update( Model.Rule.changeset( rule, %{ last_state: data.state }) )
      rule = decorate(rule)

      Serverboards.Event.emit("rules.update", %{ rule: rule }, ["rules.view"])
      if (rule.project != nil) do
        Serverboards.Event.emit("rules.update[#{rule.project}]", %{ rule: rule }, ["rules.view"])
      end
    end

    {:ok, es}
  end

  defp get_actions(rule_id) do
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

  def list(), do: list([])
  def list(map) when is_map(map) do
    list(Map.to_list(map))
  end
  def list(filter) do
    import Ecto.Query
    alias Serverboards.Project.Model.Project
    alias Serverboards.Service.Model.Service

    #Logger.debug("All rules: #{inspect Repo.all(from rule in Model.Rule)}")

    q = from rule in Model.Rule,
      left_join: service in Service,
              on: service.id == rule.service_id,
      left_join: project in Project,
              on: project.id == rule.project_id

    q = Enum.reduce(filter, q, fn
      {:project, v}, q ->
        q |> where([_rule, _service, project], project.shortname == ^v )
      {:uuid, v}, q ->
        q |> where([rule, _service, _project], rule.uuid == ^v )
      {:service, v}, q ->
        q |> where([_rule, service, _project], service.uuid == ^v )
      {:is_active, v}, q ->
        q |> where([rule, _service, _project], rule.is_active == ^v )
      end)
    q = q |> select( [rule, service, project], %{
      id: rule.id,
      is_active: rule.is_active,
      uuid: rule.uuid,
      name: rule.name,
      description: rule.description,
      project: project.shortname,
      service: service.uuid,
      from_template: rule.from_template,
      last_state: rule.last_state,
      trigger: %{
        trigger: rule.trigger,
        params: rule.params
      }
    } )

    Repo.all(q)
      |> Enum.map( fn rule ->
        name = case Serverboards.Rules.Trigger.find(id: rule.trigger.trigger ) do
          [tr] -> tr.name
          [] -> ""
        end
        Map.merge(%Serverboards.Rules.Rule{},
          Map.merge(rule, %{
            actions: get_actions( rule.id ),
            trigger: Map.merge(rule.trigger, %{ name: name })
            }) |> Map.drop([:id])
          ) |> Map.from_struct
        end)
  end

  def ps do
    GenServer.call(Serverboards.Rules, {:ps})
  end

  @doc ~S"""
  Gets a rule as from the database and returns a proper rule struct, or from the
  uuid returns the decorated rule.
  """
  def decorate(uuid) when is_binary(uuid) do
    import Ecto.Query

    case Repo.one( from c in Serverboards.Rules.Model.Rule, where: c.uuid == ^uuid ) do
      nil -> nil
      rule ->
        decorate(rule)
    end
  end
  def decorate(model) do
    import Ecto.Query

    service = case model.service_id do
      nil -> nil
      id ->
        Repo.one( from c in Serverboards.Service.Model.Service, where: c.id == ^id, select: c.uuid )
    end
    project = case model.project_id do
      nil -> nil
      id ->
        Repo.one( from c in Serverboards.Project.Model.Project, where: c.id == ^id, select: c.shortname )
    end
    actions = Repo.all(from ac in Model.ActionAtState, where: ac.rule_id == ^model.id) |> Enum.map(fn ac ->
      { ac.state, %{
        action: ac.action,
        params: ac.params,
        } }
    end) |> Map.new

    %Serverboards.Rules.Rule{
      uuid: model.uuid,
      is_active: model.is_active,
      project: project,
      service: service,
      name: model.name,
      description: model.description,
      from_template: model.from_template,
      last_state: model.last_state,
      trigger: %{
        trigger: model.trigger,
        params: model.params
      },
      actions: actions
    }
  end

  def upsert(%Serverboards.Rules.Rule{} = data, me) do
    EventSourcing.dispatch(Serverboards.Rules.EventSourcing, :upsert, %{ data: data }, me.email)
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
    project_id = case data.project do
      nil -> nil
      shortname ->
        Repo.one( from c in Serverboards.Project.Model.Project, where: c.shortname == ^shortname, select: c.id )
    end

    Logger.debug("Service id: #{inspect service_id}, projects id #{inspect project_id}")

    data = %{
      uuid: uuid,
      is_active: data.is_active,
      service_id: service_id,
      project_id: project_id,
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
        {:error, reason} ->
          Logger.error("Error starting rule #{inspect reason}. Disabling.", rule: rule)
          Serverboards.Rules.ensure_rule_not_active rule
          Repo.update(
            Model.Rule.changeset(rulem, %{ is_active: false })
          )
          %{ rule | is_active: false }
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
    actions_to_update = actions
      |> Map.to_list
      |> Enum.filter(fn {_state, action} ->
        is_binary(action.action) and (action.action != "")
        end)
    actions_to_update
      |> Enum.map(fn {state, action} ->
        action = %{
          rule_id: rule.id,
          state: state,
          action: action.action,
          params: action.params
        }
        upsert_action(rule.id, state, action)
      end)
    states = actions_to_update |> Enum.map(fn {state, _} -> state end)
    import Ecto.Query
    Repo.delete_all( from a in Model.ActionAtState, where: a.rule_id == ^rule.id and not a.state in ^states )
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


  def ensure_rule_active(%{} = rule) do
    GenServer.call(Serverboards.Rules, {:ensure_rule_active, rule})
  end
  def ensure_rule_not_active(%{} = rule) do
    GenServer.call(Serverboards.Rules, {:ensure_rule_not_active, rule})
  end

  def restart_rule(%{} = rule) do
    GenServer.call(Serverboards.Rules, {:restart_rule, rule})
  end

  def restart_rules_for_service(service) do
    Logger.debug("Service updated, check rules to restart #{service}", service: service)
    list(service: service)
      |> Enum.map( fn rule ->
        if rule.is_active do # only restart if active. Bug #13.
          restart_rule(rule)
        end
      end )
    :ok
  end

  # server impl
  def init(:ok) do
    Task.start(fn -> # do it in another process
      for r <- list([is_active: true]), do: ensure_rule_active(r)
    end)

    MOM.Channel.subscribe(:client_events, fn
      %{ payload: %{ type: "service.updated", data: %{ service: %{ uuid: uuid }}}} ->
        restart_rules_for_service(uuid)
        :ok
      _ -> :ok
    end)

    {:ok, %{}}
  end

  def handle_call({:ps}, _from, status) do
    {:reply, Map.keys(status), status}
  end
  def handle_call({:ensure_rule_active, %{} = rule}, _from, status) do
    {ret, status} = if not Map.has_key?(status, rule.uuid) do
      try do
        case Rules.Supervisor.start(rule) do
          {:ok, trigger} ->
            {:ok, Map.put(status, rule.uuid, trigger)}
          {:error, reason} ->
            {{:error, reason}, status}
        end
      catch
        :exit, _ ->
          {{:error, :exit_on_start}, status}
      end
    else
      {{:error, :not_found}, status}
    end
    #Logger.debug("Ensure active #{inspect rule.uuid} #{inspect status}")
    {:reply, ret, status}
  end
  def handle_call({:ensure_rule_not_active, %{} = rule}, _from, status) do
    #Logger.debug("Ensure not active #{inspect rule.uuid} #{inspect status}")
    status = if Map.has_key?(status, rule.uuid) do
      Rules.Supervisor.stop(rule.uuid)
      Map.drop(status, [rule.uuid])
    else
      status
    end

    {:reply, :ok, status}
  end
  def handle_call({:restart_rule, rule}, from, status) do
    {:reply, :ok, status} = handle_call({:ensure_rule_not_active, rule}, from, status)

    handle_call({:ensure_rule_active, rule}, from, status)
  end
end
