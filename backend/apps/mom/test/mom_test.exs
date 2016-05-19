require Logger

defmodule MOMTest do
  use ExUnit.Case
  @moduletag :capture_log


  doctest MOM
  doctest MOM.Channel
  doctest MOM.Channel.Broadcast
  doctest MOM.Channel.Named
  doctest MOM.Channel.PointToPoint
  doctest MOM.Tap

  def test_exitted(channel) do
    {:ok, agent} = Agent.start_link fn -> %{} end
    MOM.Channel.subscribe(channel, fn msg ->
      Logger.debug("Got message at channel #{inspect msg}")
      Agent.update(agent, fn st ->
        Logger.debug("Got message")
        Map.put(st, msg.payload.key, msg.payload.value)
      end)
      Logger.debug("Got message at channel done")
      :ok
    end)
    # send ok
    MOM.Channel.send(channel, %MOM.Message{ payload: %{ key: :a, value: :b}}, sync: true)

    # send ok too
    :ok = Agent.stop agent
    MOM.Channel.send(channel, %MOM.Message{ payload: %{ key: :a, value: :b}}, sync: true)
    MOM.Channel.send(channel, %MOM.Message{ payload: %{ key: :a, value: :b}}, sync: true)
  end

  test "Send to a process in EXIT" do
    test_exitted(:channel_a)
  end

  test "Send to process in EXIT at PointToPoint" do
    {:ok, channel} = MOM.Channel.PointToPoint.start_link

    test_exitted(channel)
  end
end
