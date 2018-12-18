require Logger

defmodule Serverboards.CacheTest do
  use ExUnit.Case, async: false
  @moduletag :capture_log

  def wait_1_sec() do
    :timer.sleep(1_000)
    :ok
  end

  def wait_w_timeout() do
    Task.async(fn ->
      :timer.sleep(10_000)
    end)
    |> Task.await(100)
  end

  def wait_5_sec() do
    :timer.sleep(5_000)
    :ok
  end

  def res_ok() do
    :ok
  end

  def res_ok2() do
    :ok2
  end

  test "Test basic cache use" do
    test_id = UUID.uuid4()

    # Logger.debug("Set some data in cache, get it fast")
    {time, data} =
      :timer.tc(fn ->
        Serverboards.Utils.Cache.get(test_id, &wait_1_sec/0)
      end)

    time = time / 1_000_000
    Logger.debug("Took #{inspect(time)} s")
    assert data == :ok
    assert time > 1.0
    assert time < 1.5

    {time, _data} =
      :timer.tc(fn ->
        Serverboards.Utils.Cache.get(test_id, &wait_1_sec/0)
      end)

    time = time / 1_000_000
    Logger.debug("Cached took #{inspect(time)} s")
    assert time < 0.01
  end

  test "Several setters/getter at the same time" do
    test_id = UUID.uuid4()

    # 100 of gets at the same time
    {time, _data} =
      :timer.tc(fn ->
        tasks =
          for _i <- 1..100 do
            Task.async(Serverboards.Utils.Cache, :get, [test_id, &wait_1_sec/0])
          end

        [res | _] =
          for i <- tasks do
            data = Task.await(i)
            assert data == :ok
            data
          end

        res
      end)

    time = time / 1_000_000
    Logger.debug("Took #{inspect(time)} s")
    assert time > 1.0
    assert time < 1.5
  end

  test "Timeout executing the external task" do
    test_id = UUID.uuid4()

    res = Serverboards.Utils.Cache.get(test_id, &wait_w_timeout/0, ttl: 200)
    Logger.debug("Result to is #{inspect(res)}, should not cache errors")
    assert res == {:error, :exit}

    res = Serverboards.Utils.Cache.get(test_id, &res_ok/0, ttl: 200)
    Logger.debug("Result to is #{inspect(res)}, caches the answer")
    assert res == :ok
    res = Serverboards.Utils.Cache.get(test_id, &res_ok2/0, ttl: 200)
    Logger.debug("Result to is #{inspect(res)}, cached")
    assert res == :ok

    :timer.sleep(300)
    res = Serverboards.Utils.Cache.get(test_id, &res_ok2/0, ttl: 200)
    Logger.debug("After TO result is #{inspect(res)}")
    assert res == :ok2
  end

  test "Too much time executing something accumulates?" do
    test_id = UUID.uuid4()

    # 100 of gets at the same time
    {time, _data} =
      :timer.tc(fn ->
        tasks =
          for _i <- 1..10 do
            Task.async(Serverboards.Utils.Cache, :get, [test_id, &wait_1_sec/0, [ttl: 100]])
          end

        Logger.debug("Task waiting #{inspect(tasks)}")

        res =
          for i <- tasks do
            data = Task.await(i)
            # might be ok, or timeout
            assert data == :ok or data == {:error, :exit}
            data
          end
      end)

    time = time / 1_000_000
    Logger.debug("Took #{inspect(time)} s")
    assert time > 1.0
    assert time < 1.5
  end

  test "Timeout is not ttl" do
    test_id = UUID.uuid4()

    {time, _data} =
      :timer.tc(fn ->
        t1 =
          Task.async(fn ->
            Serverboards.Utils.Cache.get(test_id, &wait_1_sec/0, timeout: 1_000, ttl: 100)
          end)

        :timer.sleep(200)

        t2 =
          Task.async(fn ->
            Serverboards.Utils.Cache.get(test_id, &wait_1_sec/0, timeout: 1_000, ttl: 100)
          end)

        res = Task.await(t1)
        assert res == :ok
        res = Task.await(t2)
        assert res == :ok
      end)

    time = time / 1_000_000
    Logger.debug("Took #{inspect(time)} s")
    assert time > 1.0
    assert time < 1.5
  end
end
