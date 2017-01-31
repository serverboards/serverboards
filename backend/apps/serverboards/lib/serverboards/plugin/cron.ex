require Logger

defmodule Serverboards.Plugin.Cron do
  @moduledoc ~S"""
  Uses the Quantum elixir library to manage the cron components.

  This module helps to maintain state, reloading the rules when the plugins are
  loaded.
  """
  use GenServer
  def start_link(options \\ []) do
    GenServer.start_link(__MODULE__, [], [name: __MODULE__] ++ options)
  end

  def reload_cron() do
    GenServer.cast(__MODULE__, {:reload_cron})
  end

  # impl
  def init([]) do
    MOM.Channel.subscribe(:client_events, fn %{ payload: payload } ->
      if payload.type == "plugins_reload" do
        reload_cron()
      end
    end)

    reload_cron()

    {:ok, []}
  end

  def handle_cast({:reload_cron}, status) do
    for s <- status do
      Quantum.delete_job(s)
    end

    comp = Serverboards.Plugin.Registry.filter_component(type: "cron")

    crons = for c <- comp do
      Quantum.add_job(c.id, %Quantum.Job{
        schedule: c.extra["cron"],
        task: fn ->
          Logger.info("Execute cron #{c.id} // #{c.extra["action"]}")
          Serverboards.Action.trigger( c.extra["action"], Map.get(c.extra, "params", %{}), %{ email: "cron/#{c.id}" })
        end
        })
      c.id
    end
    if status != comp do
      Logger.info("Cron list updated: #{inspect crons}")
    end

    {:noreply, crons}
  end
end
