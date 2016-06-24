require Serverboards.Logger
alias Serverboards.Logger

defmodule Serverboards.Rules do
  alias Serverboards.Rules.Model
  alias Serverboards.Rules
  alias Serverboards.Repo
  use GenServer

  def start_link options do
    {:ok, es} = EventSourcing.start_link( [name: :rules] ++ options )
    Serverboards.Rules.Rule.setup_eventsourcing(es)
    GenServer.start_link(__MODULE__, :ok, name: Serverboards.Rules)
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
      is_active: rule.is_active,
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

  def ps do
    GenServer.call(Serverboards.Rules, {:ps})
  end

  def ensure_rule_active(rule) do
    GenServer.call(Serverboards.Rules, {:ensure_rule_active, rule})

  end
  def ensure_rule_not_active(rule) do
    GenServer.call(Serverboards.Rules, {:ensure_rule_not_active, rule})

  end

  # server impl
  def init(:ok) do
    {:ok, %{}}
  end

  def handle_call({:ps}, _from, status) do
    {:reply, Map.keys(status), status}
  end
  def handle_call({:ensure_rule_active, rule}, _from, status) do
    status = if not rule in status do
      {:ok, trigger} = Rules.Rule.start_link(rule)
      Map.put(status, rule.uuid, trigger)
    end
    {:reply, :ok, status}
  end
  def handle_call({:ensure_rule_not_active, rule}, _from, status) do

    status = if not rule in status do
      trigger = status[rule]
      Rules.Rule.stop(trigger)
      Map.drop(status, [rule.uuid])
    end


    {:reply, :ok, status}
  end
end
