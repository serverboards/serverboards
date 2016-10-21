require Logger

defmodule Serverboards.Rules.Supervisor do
  @moduledoc """
  Supervises all individual rules, ensuring that if any one fails, it will be
  restarted
  """
  use Supervisor

  def start_link(options \\ []) do
    Supervisor.start_link(__MODULE__, :ok, [name: Serverboards.Rules.Rule.Supervisor] ++ options)
  end
  def init(:ok) do
    children = [
      worker(Serverboards.Rules.Rule, [], restart: :temporary)
    ]

    supervise(children, strategy: :simple_one_for_one)
  end

  def start(ruledef) do
    Logger.debug("Start rule #{inspect ruledef}")
    Supervisor.start_child(Serverboards.Rules.Rule.Supervisor, [ruledef, []])
  end

  def stop(uuid) do
    Serverboards.Rules.Rule.stop(uuid)
  end
end
