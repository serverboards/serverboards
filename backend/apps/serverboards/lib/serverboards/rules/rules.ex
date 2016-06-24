require Serverboards.Logger
alias Serverboards.Logger

defmodule Serverboards.Rules do
  alias Serverboards.Rules.Model
  alias Serverboards.Repo

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

end
