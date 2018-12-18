require Logger

defmodule Serverboards.Plugin.Init.Supervisor do
  @moduledoc """
  Supervisor for init proceses, keep them running always.
  """
  use Supervisor

  def start_link(options \\ []) do
    {:ok, pid} = Supervisor.start_link(__MODULE__, [], options)
    # Logger.debug("Start init supervisor: #{inspect pid}")

    start_inits()

    MOM.Channel.subscribe(:client_events, fn %{payload: payload} ->
      if payload.type == "plugins.reloaded" do
        Logger.info("Reloading init services. #{inspect(pid)}")

        for {_id, pid, _type, _modules} <- Supervisor.which_children(pid) do
          # Stop all pids, normally
          Serverboards.Plugin.Init.stop(pid)
        end

        start_inits()
        :unsubscribe
      end
    end)

    {:ok, pid}
  end

  def start_inits() do
    init_services = Serverboards.Plugin.Registry.filter_component(type: "init")
    Logger.info("Starting #{inspect(Enum.count(init_services))} init services")

    for c <- init_services do
      c = Serverboards.Plugin.Init.from_component(c)
      start_init(c)
    end
  end

  def init([]) do
    children = [
      worker(Serverboards.Plugin.Init, [], restart: :transient)
    ]

    supervise(children, strategy: :simple_one_for_one)
  end

  def start_init(%Serverboards.Plugin.Init{} = init) do
    Supervisor.start_child(__MODULE__, [init])
  end
end
