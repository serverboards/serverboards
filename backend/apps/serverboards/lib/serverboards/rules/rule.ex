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
      Logger.debug("#{inspect params} #{inspect actions}")
      state = params["state"]
      action = actions[state]

      if action do
        params = Map.merge(action.params, default_params)

        Logger.info("Triggered action #{inspect action}", rule: rule, params: params, action: action)
        Serverboards.Action.trigger(action.action, params, %{ email: "rule/#{rule.uuid}", perms: []})
      else
        Logger.info("Triggered empty action. Doing nothing.")
        {:ok, :empty}
      end
    end
  end

  def stop(rule) do
    Logger.info("Stop rule with trigger #{rule}", rule: rule)
    Serverboards.Rules.Trigger.stop rule
  end
end
