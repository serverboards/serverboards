require Serverboards.Logger
alias Serverboards.Logger

defmodule Serverboards.Rules do
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
end
