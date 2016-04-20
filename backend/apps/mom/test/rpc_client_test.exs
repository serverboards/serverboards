require Logger
defmodule Serverboards.RPCTest do
  use ExUnit.Case
  #@moduletag :capture_log
  doctest Serverboards.MOM.RPC.Client, import: true

  alias Serverboards.MOM.RPC.Client

  def easy_agent do
    {:ok, agent} = Agent.start_link fn -> %{} end
    update_agent = fn k ->
      fn data -> Agent.update(agent, fn st ->
          Logger.debug("updating logger with #{data}")
          Map.put(st, k, data)
        end)
      end
    end
    get_agent = fn k ->
      Agent.get(agent, fn st ->
        Map.get st, k, :none
      end)
    end

    {update_agent, get_agent}
  end

  test "Create and stop a client" do
    {update_agent, get_agent} = easy_agent
    {:ok, client} = Client.start_link update_agent.(:last_line), update_agent.(:shutdown)

    Client.stop client

    assert get_agent.(:shutdown) == :shutdown
  end

  test "Bad protocol" do
    {update_agent, get_agent} = easy_agent
    {:ok, client} = Client.start_link update_agent.(:last_line), update_agent.(:shutdown)

    Client.parse_line client, "bad protocol"

    assert get_agent.(:shutdown) == :bad_protocol
  end

  test "Good protocol" do
    {update_agent, get_agent} = easy_agent
    {:ok, client} = Client.start_link update_agent.(:last_line), update_agent.(:shutdown)

    {:ok, mc} = JSON.encode(%{method: "dir", params: [], id: 1})
    Client.parse_line client, mc

    :timer.sleep(200)

    {:ok, json} = JSON.decode( get_agent.(:last_line) )
    assert Map.get(json,"result") == ~w(dir ping version)

    Client.stop(client)
  end


end
