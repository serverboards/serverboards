require Logger

defmodule Serverboards.IO.Cmd.Supervisor do
  @moduledoc """
  Supervisor for extranl executed commands/plugins.

  This isolates abort errors and such.
  """
  use Supervisor

  def start_link(options) do
    Supervisor.start_link(__MODULE__, [], options)
  end

  def init([]) do
    children = [
      worker(Serverboards.IO.Cmd, [], restart: :transient)
    ]

    supervise(children, strategy: :simple_one_for_one)
  end

  def start_command(cmd, args, cmdopts, opts) do
    Supervisor.start_child(__MODULE__, [cmd, args, cmdopts, opts])
  end
end
