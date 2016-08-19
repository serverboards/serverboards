require Logger

defmodule Serverboards.Rules do
  alias Serverboards.Rules.Model
  alias Serverboards.Rules
  alias Serverboards.Repo
  use GenServer

  def start_link options do
    {:ok, es} = EventSourcing.start_link( [name: :rules] ++ options )
    Serverboards.Rules.Rule.setup_eventsourcing(es)
    Serverboards.Rules.RPC.start_link
    {:ok, pid } = GenServer.start_link(__MODULE__, :ok, name: Serverboards.Rules)

    for r <- list([is_active: true]), do: ensure_rule_active(r)

    {:ok, pid}
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
    alias Serverboards.Serverboard.Model.Serverboard
    alias Serverboards.Service.Model.Service

    #Logger.debug("All rules: #{inspect Repo.all(from rule in Model.Rule)}")

    q = from rule in Model.Rule,
      left_join: service in Service,
              on: service.id == rule.service_id,
      left_join: serverboard in Serverboard,
              on: serverboard.id == rule.serverboard_id

    q = Enum.reduce(filter, q, fn
      {:serverboard, v}, q ->
        q |> where([_rule, _service, serverboard], serverboard.shortname == ^v )
      {:uuid, v}, q ->
        q |> where([rule, _service, _serverboard], rule.uuid == ^v )
      {:service, v}, q ->
        q |> where([_rule, service, _serverboard], service.uuid == ^v )
      {:is_active, v}, q ->
        q |> where([rule, _service, _serverboard], rule.is_active == ^v )
      end)
    q = q |> select( [rule, service, serverboard], %{
      id: rule.id,
      is_active: rule.is_active,
      uuid: rule.uuid,
      name: rule.name,
      description: rule.description,
      serverboard: serverboard.shortname,
      service: service.uuid,
      from_template: rule.from_template,
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

  def rule_templates(filter \\ []) do
    Serverboards.Plugin.Registry.filter_component([type: "rule template"] ++ filter)
    |> Enum.map(fn %{ name: name, traits: traits, id: id, description: description, plugin: plugin, extra: extra} ->
      %{
        id: id,
        name: name,
        traits: traits,
        description: description,
        plugin: plugin,
        trigger: %{
          trigger: extra["trigger"]["trigger"],
          params: extra["trigger"]["params"]
        },
        actions: Map.new(Enum.map(Map.to_list(extra["actions"]), fn {k,v}->
          {k, %{
            params: v["params"],
            action: v["action"]
          } }
        end))
      }
    end)
  end

  def ps do
    GenServer.call(Serverboards.Rules, {:ps})
  end

  def ensure_rule_active(%{} = rule) do
    GenServer.call(Serverboards.Rules, {:ensure_rule_active, rule})

  end
  def ensure_rule_not_active(%{} = rule) do
    GenServer.call(Serverboards.Rules, {:ensure_rule_not_active, rule})

  end

  # server impl
  def init(:ok) do
    {:ok, %{}}
  end

  def handle_call({:ps}, _from, status) do
    {:reply, Map.keys(status), status}
  end
  def handle_call({:ensure_rule_active, %{} = rule}, _from, status) do
    status = if not Map.has_key?(status, rule.uuid) do
      {:ok, trigger} = Rules.Rule.start_link(rule)
      Map.put(status, rule.uuid, trigger)
    end
    #Logger.debug("Ensure active #{inspect rule.uuid} #{inspect status}")
    {:reply, :ok, status}
  end
  def handle_call({:ensure_rule_not_active, %{} = rule}, _from, status) do
    #Logger.debug("Ensure not active #{inspect rule.uuid} #{inspect status}")
    status = if Map.has_key?(status, rule.uuid) do
      trigger = status[rule.uuid]
      Rules.Rule.stop(trigger)
      Map.drop(status, [rule.uuid])
    else
      status
    end

    {:reply, :ok, status}
  end
end
