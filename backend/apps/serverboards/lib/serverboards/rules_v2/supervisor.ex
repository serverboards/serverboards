require Logger

defmodule Serverboards.RulesV2.Supervisor do
  def start_link(options \\ []) do
    import Supervisor.Spec

    Serverboards.RulesV2.Rules.start_ets_table()

    children=[
      worker(Serverboards.RulesV2.RPC, [[name: Serverboards.RulesV2.RPC]]),
      #worker(GenServer, [__MODULE__, :ok, [name: Serverboards.Rules] ++ options] ),
      worker(Serverboards.RulesV2.Rules, [], function: :start_eventsourcing),
      #worker(Serverboards.ProcessRegistry, [[name: Serverboards.Rules.Registry]]),
      # worker(Serverboards.RulesV2.Rules, [[name: Serverboards.RulesV2.Rules]]),
      supervisor(Registry, [:unique, :rules_registry]),

      supervisor(Serverboards.RulesV2.Rule.Supervisor,[]),
    ]

    Supervisor.start_link(children, [strategy: :one_for_one, name: Serverboards.RulesV2.Supervisor] ++ options)
  end

end

defmodule Serverboards.RulesV2.Rule.Supervisor do
  @moduledoc """
  Supervises all individual rules, ensuring that if any one fails, it will be
  restarted
  """
  use Supervisor
  import Supervisor.Spec

  def start_link(options \\ []) do
    {:ok, pid} = Supervisor.start_link(__MODULE__, :ok, [name: Serverboards.RulesV2.Rule.Supervisor] ++ options)

    rules = Serverboards.RulesV2.Rules.list(%{ is_active: true })
    Logger.info("Started rule supervisor. Starting #{Enum.count(rules)} rules.")

    success? = for {r, n} <- Enum.with_index(rules, 1) do
      case start(r) do
        {:ok, pid} ->
          Logger.info("#{n}. Rule #{inspect r.uuid} started", rule: r)
          :ok
        {:error, code} ->
          Logger.error("#{n}. Rule #{inspect r.uuid} error starting: #{inspect code}", rule: r)
          :error
      end
    end
    success_count = Enum.reduce(success?, 0, fn
      (:ok, acc) -> acc+1
      (:error, acc) -> acc
    end)
    Logger.info("Started #{success_count} or #{Enum.count(rules)} rules.")

    {:ok, pid }
  end

  def init(:ok) do
    children = [
      worker(Serverboards.RulesV2.Rule, [], restart: :temporary)
    ]

    supervise(children, strategy: :simple_one_for_one)
  end

  def start(ruledef) do
    # Logger.debug("Start rule #{inspect ruledef}")
    Supervisor.start_child(Serverboards.RulesV2.Rule.Supervisor, [ruledef, []])
  end

  def stop(uuid) do
    Serverboards.RulesV2.Rule.stop(uuid)
  end
end
