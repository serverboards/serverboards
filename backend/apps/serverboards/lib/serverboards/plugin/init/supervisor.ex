require Logger

defmodule Serverboards.Plugin.Init.Supervisor do
  @moduledoc """
  Supervisor for init proceses, keep them running always.
  """
  use Supervisor

  def start_link(options \\ []) do
    {:ok, pid} = Supervisor.start_link(__MODULE__,[], options)

    for c <- Serverboards.Plugin.Registry.filter_component( type: "init" ) do
      c = Serverboards.Plugin.Init.from_component(c)
      start_init(c)
    end

    MOM.Channel.subscribe(:client_events, fn %{ payload: payload } ->
      if payload.type == "plugins_reload" do
        Logger.debug("New client event: #{inspect payload}")
        Logger.debug Process.exit(pid, :kill) # Force reload of all inits
      end
    end)

    {:ok, pid}
  end

  def init([]) do
    children = [
      worker( Serverboards.Plugin.Init, [], restart: :transient)
    ]

    supervise(children, strategy: :simple_one_for_one)
  end

  def start_init(%Serverboards.Plugin.Init{} = init) do
    Supervisor.start_child(__MODULE__, [init])
  end
end
