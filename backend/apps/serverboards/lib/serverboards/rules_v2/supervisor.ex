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
      supervisor(Serverboards.RulesV2.Rule.Supervisor,[])
    ]

    Supervisor.start_link(children, strategy: :one_for_one, name: Serverboards.RulesV2.Supervisor)
  end

end

defmodule Serverboards.RulesV2.Rule.Supervisor do
  @moduledoc """
  Supervises all individual rules, ensuring that if any one fails, it will be
  restarted
  """
  use Supervisor

  def start_link(options \\ []) do
    Supervisor.start_link(__MODULE__, :ok, [name: Serverboards.RulesV2.Rule.Supervisor] ++ options)
  end
  def init(:ok) do
    children = [
      worker(Serverboards.RulesV2.Rule, [], restart: :temporary)
    ]

    supervise(children, strategy: :simple_one_for_one)
  end

  def start(ruledef) do
    #Logger.debug("Start rule #{inspect ruledef}")
    Supervisor.start_child(Serverboards.RulesV2.Rule.Supervisor, [ruledef, []])
  end

  def stop(uuid) do
    Serverboards.RulesV2.Rule.stop(uuid)
  end
end
