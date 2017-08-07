require Logger

defmodule FileTest do
  use ExUnit.Case, async: false
  @moduletag :capture_log

  alias Test.Client
  alias Serverboards.File.Pipe

  doctest Pipe, import: true
  test "Simple write and read" do
    {:ok, wfd, rfd} = Pipe.pipe()

    assert :ok == Pipe.write(wfd, "test")
    assert {:ok, "test"} == Pipe.read(rfd)

    # and in order and by packet

    assert :ok == Pipe.write(wfd, "test1")
    assert :ok == Pipe.write(wfd, "test2")
    assert :ok == Pipe.write(wfd, "test3")

    assert {:ok, "test1"} == Pipe.read(rfd)
    assert {:ok, "test2"} == Pipe.read(rfd)
    assert {:ok, "test3"} == Pipe.read(rfd)

    :ok = Pipe.close(rfd)
    :ok = Pipe.close(wfd)

    {:error, :not_found} = Pipe.close(rfd)
  end

  test "Out of order, async" do
    {:ok, wfd, rfd} = Pipe.pipe()
    assert {:ok, nil} == Pipe.read(rfd, async: true)
    assert :ok == Pipe.write(wfd, "test4")
    assert {:ok, "test4"} == Pipe.read(rfd, async: true)
  end

  test "Out of order, sync" do
    {:ok, wfd, rfd} = Pipe.pipe()

    task = Task.async( fn ->
      for i <- 1..3 do
        {:ok, res} = Pipe.read(rfd)
        res
      end
    end)
    # Assert data is not received yet
    assert Task.yield( task, 100) == nil

    # write it, should be received
    assert :ok == Pipe.write(wfd, "test5")
    assert :ok == Pipe.write(wfd, "test6")
    assert :ok == Pipe.write(wfd, "test7")
    Task.await(task) == ["test5", "test6", "test7"]
  end

  test "When parent die, I die" do
    task = Task.async(fn ->
      Pipe.pipe() # when task finishes, the fds should not be valid.
    end)
    {:ok, wfd, rfd} = Task.await(task)
    :timer.sleep(100)
    {:error, :not_found} = Pipe.close(wfd)
  end

  test "Set a specific parent, whenit dies, it dies" do
    parent = Task.async(fn ->
      receive do
        :stop -> :ok
      end
    end)

    {:ok, wfd, rfd} = Pipe.pipe(parent: parent.pid)

    :ok = Pipe.write(wfd, "test8")
    :ok = Pipe.write(wfd, "test9")

    Logger.debug("Now stop it")
    send(parent.pid, :stop)
    Task.await(parent)
    :timer.sleep(100)

    Logger.debug("Try to write")
    {:error, :not_found} = Pipe.write(wfd, "test8")
    {:error, :not_found} = Pipe.read(rfd)
  end

end
