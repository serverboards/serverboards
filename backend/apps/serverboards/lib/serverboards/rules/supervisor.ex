defmodule Serverboards.Rules.Supervisor do
  @moduledoc """
  Supervises all individual rules, ensuring that if any one fails, it will be
  restarted
  """
  use Supervisor

  def start_link(options \\ []) do
    Supervisor.start_link(__MODULE__,:ok, [name: __MODULE__] ++ options)
  end
  def init(:ok) do
    children = [
      worker(Serverboards.Rules.Rule, [], restart: :temporary)
    ]

    supervise(children, strategy: :simple_one_for_one)
  end

  def start_rule(params) do
    Supervisor.start_rule(__MODULE__, params)
  end
end
