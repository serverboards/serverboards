require Logger

defmodule Serverboards.RulesV2.Rule do
  use GenServer

  def start_link(rule, options \\ []) do
    options = [name: via(rule.uuid)] ++ options

    GenServer.start_link(__MODULE__, rule, options)
  end

  def via(rule_uuid) do
    {:via, Registry, {:rules_registry, rule_uuid}}
  end

  def is_running?(uuid) do
    Registry.lookup(:rules_registry, uuid) != []
  end
  def ensure_running( rule ) do
    if not is_running?(rule.uuid) do
      Serverboards.RulesV2.Rule.Supervisor.start(rule)
    end
  end
  def ensure_not_running( rule ) do
    if is_running?(rule.uuid) do
      stop(rule.uuid)
    end
  end
  def set_state(uuid, state) do
    Serverboards.RulesV2.Rules.set_state(uuid, state, %{ email: "rule/#{uuid}"})
  end

  def trigger(rule_id, params) do
    GenServer.cast(rule_id, {:trigger, params})
  end

  def stop(what), do: stop(what, :normal, :infinity)
  def stop(what, reason), do: stop(what, reason, :infinity)
  def stop(pid, reason, timeout) when is_pid(pid) do
    # Logger.info("STOP #{inspect pid}")
    GenServer.stop(pid, reason, timeout)
  end
  def stop(uuid, reason, timeout) when is_binary(uuid) do
    # Logger.info("STOP #{inspect uuid}")
    GenServer.stop(via(uuid), reason, timeout)
  end

  ## Server impl

  def init(%{ from_template: nil} = rule) do
    # Logger.info("Starting rule #{inspect rule}")
    uuid = rule.uuid

    case start_trigger(uuid, rule.rule["when"]) do
      {:ok, trigger} ->
        # Logger.debug("Got trigger #{inspect trigger}")

        {:ok, %{
          trigger: trigger,
          rule: rule,
          uuid: uuid,
          running: false,
          state: Serverboards.RulesV2.Rules.get_state(uuid) || %{},
          last_wakeup: DateTime.utc_now()
          }}
      {:error, error} ->
        Logger.error("Error starting trigger: #{inspect error}.", rule: rule.rule)
        {:stop, :cant_start_trigger}
    end
  end
  def init(rule) do
    template = Serverboards.Plugin.Registry.find(rule.from_template) |> Map.drop([:plugin])

    # Logger.debug("Template data to fill: #{inspect template.extra["fields"]} #{inspect rule.rule["template_data"]}")
    params = decorate_params( rule.rule["template_data"], template.extra["fields"] )
    Logger.debug(inspect params)

    {:ok, final_rule} = Serverboards.Utils.Template.render_map( template.extra["rule"], params )

    rule = %{ rule |
      rule: final_rule,
      from_template: nil
    }

    init(rule)
  end

  def decorate_params( params, desc ) do
    Enum.reduce( desc, params, fn
      %{ "name" => name, "type" => "service" }, params ->
        %{ params |
            name => Serverboards.Service.decorate( params[name] )
          }
      _other, params ->
        params
    end)
  end

  def status(uuid) do
    GenServer.call(via(uuid), :status)
  end

  def start_trigger(uuid, w) do
    with [trigger] <- Serverboards.Rules.Trigger.find(id: w["trigger"]),
         {:ok, plugin_id} <- Serverboards.Plugin.Runner.start(trigger.command, "system/rule_v2"),
         {:ok, client} <- Serverboards.Plugin.Runner.client plugin_id
    do
      setup_client_for_rules(self(), uuid, client)

      default_params = %{
        id: uuid,
      }

      params = Map.merge(w["params"], default_params)
      paramsdef = [%{ "name" => "id", "value" => uuid }] ++ Map.get(trigger.start, "params", [])
      method = Map.put( trigger.start, "params", paramsdef )
      # Logger.debug("Call #{inspect plugin_id}.#{inspect method["method"]}(#{inspect params})")
      case Serverboards.Plugin.Runner.call( plugin_id, method, params ) do
        {:ok, stop_id} ->
          stop_id = if stop_id do stop_id else uuid end

          {:ok, %{
            trigger: trigger,
            plugin_id: plugin_id,
            stop_id: stop_id,
            }}
        {:error, error} -> {:error, error}
      end
    else
      [] -> {:error, :not_found}
      error -> error
    end
  end

  def setup_client_for_rules(pid, uuid, %MOM.RPC.Client{} = client) do
    MOM.RPC.Client.add_method client, "trigger", fn
      %{} = params ->
        if uuid == params["id"] do
          trigger(pid, params)
        end
      [%{} = params] ->
        if uuid == params["id"] do
          trigger(pid, params)
        end
      [params] ->
        if uuid == (List.first(params)) do
          trigger(pid, params)
        end
    end
  end

  @doc ~S"""
  Prepares the state to start executing acitons at next :continue mesage.

  It does not execute the actions straight away, as it blocks the process whicle
  executing the acitons. So there should be some checking of the messages just
  in case there is a special event, as stop.

  Also it must discard and log extra triggers while executing, or the message
  queue will force execution after execution.

  So it sets at :running the list of actions to perform. The first item will be
  next action and so on. If the aciton is a conditional, it will place the
  proper branch on top of the list of actions to execute.

  When the list is empty, all actions have been executed.

  For all this to work, the :continue message has to be inserted after every
  action is performed.

  """
  def handle_cast({:trigger, params}, state) do
    if state.running == false do
      # Logger.debug("Trigger action: #{inspect state, pretty: true}\n")
      when_id = Map.get(state.rule.rule["when"], "id", "A")
      params = Map.merge( state.rule.rule["when"]["params"], params )
      uuid = state.rule.uuid
      trigger_state = Map.put(%{ "uuid" => uuid}, when_id, params)

      prev_state = Map.drop(state.state, ["prev", "changes"])
      changes = Serverboards.Utils.map_diff( prev_state, trigger_state )

      trigger_state = Map.merge(trigger_state, %{ "prev" => prev_state, "changes" => changes })
      # Logger.debug("Start trigger with state #{inspect trigger_state, pretty: true}")

      state = %{ state |
        running: state.rule.rule["actions"],
        state: trigger_state,
        last_wakeup: DateTime.utc_now()
        }
      GenServer.cast(self(), :continue) # yields execution of actions.

      #Logger.info("Trigger! #{inspect params} #{inspect state}")
      #{:ok, rule_final_state} = execute_actions(uuid, state.rule.rule["actions"], trigger_state)
      #Logger.info("Final state: #{inspect rule_final_state}")

      {:noreply, state}
    else
      Logger.info("Ignoring retrigger of #{inspect state.uuid}. Already executing actions.", rule: state.rule)
      {:noreply, state}
    end
  end

  def handle_cast(:continue, %{ running: [] } = state) do
    # Logger.debug("Action chain finished. Final state is #{inspect state.state, pretty: true}")

    # Store the state in the DB
    set_state(state.uuid, state.state)

    state = %{ state |
      running: false,
    }

    {:noreply, state}
  end
  def handle_cast(:continue, state ) do
    %{ running: [ action | rest], uuid: uuid, state: rule_state} = state
    # Logger.debug("#{inspect self()}: Continue executing actions: now: #{inspect action, pretty: true},\n   later: #{inspect rest, pretty: true}")


    { head, rule_state } = execute_action( uuid, action, rule_state)

    state = %{ state |
      running: head ++ rest,
      state: rule_state
    }
    # Logger.debug("Running queue is now: #{inspect state.running, pretty: true}")
    GenServer.cast(self(), :continue)

    {:noreply, state}
  end

  def handle_call(:status, _from, state) do
    {:reply, state, state}
  end

  def execute_action(uuid, %{
      "type" => "action",
      "action" => action,
      "params" => params
      } = actiondef, state) do
    {:ok, params} = Serverboards.Utils.Template.render_map(params, state)

    result = Serverboards.Action.trigger_wait(action, params, "rule/#{uuid}")

    result = if Enum.count(result)==1 and Map.has_key?(result, :result) do
      result[:result] else result end

    action_id = Map.get(actiondef, "id")
    # Logger.info("Result #{inspect action_id} is #{inspect result}")
    state = if action_id do Map.put(state, action_id, result)
      else state end

    {[], state}
  end

  def execute_action(uuid, %{
      "type" => "condition",
      "condition" => condition,
      "then" => then_actions,
      "else" => else_actions
      }, state) do
    case ExEval.eval(condition, [state]) do
      {:ok, condition_result} ->
        if condition_result do
          # Logger.debug("#{inspect condition} -> true")
          { then_actions, state }
        else
          # Logger.debug("#{inspect condition} -> false")
          { else_actions, state }
        end
      {:error, {:unknown_var, varname, _context}} ->
        #Logger.debug("Unknown variable #{inspect varname} at condition #{inspect condition}. Resolving as false.", rule_id: uuid)
        { else_actions, state }
    end
  end

  def terminate(reason, state) do
    case reason do
      :normal ->
        Logger.info("Rule #{inspect state.uuid} stopped.", rule_id: state.uuid)
      other ->
        Logger.error("Terminate #{inspect reason}")
    end

    plugin_id=state.trigger.plugin_id

    case state.trigger[:stop] do
      nil -> :ok
      stop_method ->
        stop_id=state.trigger.stop_id
        Serverboards.Plugin.call(plugin_id, stop_method, stop_id)
    end

    Serverboards.Plugin.Runner.stop(plugin_id)
  end
end
