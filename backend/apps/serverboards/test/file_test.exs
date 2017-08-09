require Logger

defmodule FileTest do
  use ExUnit.Case, async: false
  @moduletag :capture_log

  # alias Test.Client
  alias Serverboards.File.Pipe


  setup do
    # Explicitly get a connection before each test
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(Serverboards.Repo)
    # Setting the shared mode must be done only after checkout
    Ecto.Adapters.SQL.Sandbox.mode(Serverboards.Repo, {:shared, self()})
  end

  doctest Pipe, import: true
  test "Simple write and read" do
    {:ok, wfd, rfd} = Pipe.pipe()

    assert 4 == Pipe.write(wfd, "test")
    assert {:ok, "test"} == Pipe.read(rfd)

    # and in order and by packet

    assert 5 == Pipe.write(wfd, "test1")
    assert 5 == Pipe.write(wfd, "test2")
    assert 5 == Pipe.write(wfd, "test3")

    assert {:ok, "test1"} == Pipe.read(rfd)
    assert {:ok, "test2"} == Pipe.read(rfd)
    assert {:ok, "test3"} == Pipe.read(rfd)

    :ok = Pipe.close(rfd)
    :ok = Pipe.close(wfd)

    {:ok, "already_closed"} = Pipe.close(rfd)
  end

  test "Out of order, async" do
    {:ok, wfd, rfd} = Pipe.pipe()
    assert {:ok, ""} == Pipe.read(rfd, nonblock: true)
    assert 5 == Pipe.write(wfd, "test4")
    assert {:ok, "test4"} == Pipe.read(rfd, nonblock: true)
  end

  test "Out of order, sync" do
    {:ok, wfd, rfd} = Pipe.pipe()

    task = Task.async( fn ->
      for _i <- 1..3 do
        {:ok, res} = Pipe.read(rfd)
        res
      end
    end)
    # Assert data is not received yet
    assert Task.yield( task, 100) == nil

    # write it, should be received
    assert 5 == Pipe.write(wfd, "test5")
    assert 5 == Pipe.write(wfd, "test6")
    assert 5 == Pipe.write(wfd, "test7")
    assert Task.await(task) == ["test5", "test6", "test7"]
  end

  test "Write async and blocking" do
    {:ok, wfd, rfd} = Pipe.pipe(max_buffers: 1)

    assert Pipe.write(wfd, "nonblock1", nonblock: true) == 9
    assert Pipe.write(wfd, "nonblock2", nonblock: true) == 0
    assert Pipe.write(wfd, "nonblock3", nonblock: true) == 0

    assert Pipe.read(rfd, nonblock: true) == {:ok, "nonblock1"}
    assert Pipe.read(rfd, nonblock: true) == {:ok, ""}

    # ready to read fast
    task = Task.async(fn ->
      Pipe.read(rfd)
      Pipe.read(rfd)
      Pipe.read(rfd)
    end)
    # write slow, no problems, waiting for empty
    assert Pipe.write(wfd, "nonblock4", nonblock: true) == 9
    Pipe.sync(wfd)
    assert Pipe.write(wfd, "nonblock5", nonblock: true) == 9
    Pipe.sync(wfd)
    assert Pipe.write(wfd, "nonblock6", nonblock: true) == 9
    Pipe.sync(wfd)

    assert Task.await(task) == {:ok, "nonblock6"}

    # test blocking write
    task = Task.async(fn ->
      Logger.debug("write 1")
      Pipe.write(wfd,"block1") # should unblock as reading
      Logger.debug("wrote 1")

      Logger.debug("write 2")
      Pipe.write(wfd,"block2")
      Logger.debug("wrote 2")

      :timer.sleep(100)

      Logger.debug("write 3")
      Pipe.write(wfd,"block3")
      Logger.debug("wrote 3")
    end)

    :timer.sleep(300)
    Logger.debug("read 1")
    assert Pipe.read(rfd) == {:ok, "block1"}
    Logger.debug("read 2")
    assert Pipe.read(rfd) == {:ok, "block2"}
    Logger.debug("no read 3")
    assert Pipe.read(rfd, nonblock: true) == {:ok, ""}
    :timer.sleep(300)
    Logger.debug("read 3")
    assert Pipe.read(rfd, nonblock: true) == {:ok, "block3"}

  end

  test "When parent die, I die" do
    task = Task.async(fn ->
      Pipe.pipe() # when task finishes, the fds should not be valid.
    end)
    {:ok, wfd, _rfd} = Task.await(task)
    :timer.sleep(100)
    {:ok, "already_closed"} = Pipe.close(wfd)
  end

  test "Set a specific parent, when it dies, it dies" do
    parent = Task.async(fn ->
      receive do
        :stop -> :ok
      end
    end)

    {:ok, wfd, rfd} = Pipe.pipe(parent: parent.pid)

    5 = Pipe.write(wfd, "test8")
    5 = Pipe.write(wfd, "test9")

    Logger.debug("Now stop it")
    send(parent.pid, :stop)
    Task.await(parent)
    :timer.sleep(100)

    Logger.debug("Try to write")
    assert {:ok, false} == Pipe.write(wfd, "test8")
    assert {:ok, false} == Pipe.read(rfd)
  end

  test "Write some, close, then read it" do
    {:ok, wfd, rfd} = Pipe.pipe(async: false)

    task1 = Task.async(fn ->
      Logger.debug("Write 1")
      assert 5 == Pipe.write(wfd, "test9")
      :timer.sleep(100)
      Logger.debug("Write 2")
      assert 6 == Pipe.write(wfd, "test10")
      :timer.sleep(100)
      Logger.debug("Wait for all read")
      Pipe.sync(wfd)
      Logger.debug("Done")

      Pipe.close(wfd)
    end)

    Pipe.fcntl(wfd, async: true)

    task2 = Task.async(fn ->
      :timer.sleep(50)
      Logger.debug("Read 1")
      assert Pipe.read(rfd) == {:ok, "test9"}
      :timer.sleep(250)
      Logger.debug("Read 2")
      assert Pipe.read(rfd) == {:ok, "test10"}

      Logger.debug("Read done")

      Pipe.close(rfd)
    end)

    assert Task.await(task1) == :ok
    assert Task.await(task2) == :ok
  end

  test "Using RPC, two different clients" do
    # we create the pipe in one client, write ther, and read from another
    {:ok, client} = Test.Client.start_link as: "dmoreno@serverboards.io"
    {:ok, client2} = Test.Client.start_link as: "dmoreno@serverboards.io"

    Logger.debug("CREATE")

    {:ok, [wfd, rfd]} = Test.Client.call(client, "file.pipe", %{async: true})
    Logger.debug("Wfd #{inspect wfd}, rfd #{inspect rfd}")

    Logger.debug("WRITE")

    # write at client A
    data = "asdfgasdfg"
    assert {:ok, byte_size(data)} == Test.Client.call(client, "file.write", [wfd, data])

    Logger.debug("READ")

    # read from B
    {:ok, data} = Test.Client.call(client2, "file.read", [rfd])

    assert data == "asdfgasdfg"

    Logger.debug("STOP")
    # close A, should terminate the pipe
    #Test.Client.stop(client)
    GenServer.stop(client.pid)
    Logger.debug("#{inspect client.pid}")

    # as owner is dead, the pipe is closed, all data lost.
    assert {:ok, false} == Test.Client.call(client2, "file.read", [rfd])
  end

  test "Using RPC, API test" do
    # we create the pipe in one client, write ther, and read from another
    data = "asdfgasdfg"
    {:ok, client} = Test.Client.start_link as: "dmoreno@serverboards.io"

    {:ok, [wfd, rfd]} = Test.Client.call(client, "file.pipe", %{async: true})
    assert {:ok, byte_size(data)} == Test.Client.call(client, "file.write", [wfd, data])
    assert {:ok, data} == Test.Client.call(client, "file.read", [rfd])
    assert {:ok, :ok} == Test.Client.call(client, "file.fcntl", [wfd, %{ async: false} ])
    assert {:ok, :ok} == Test.Client.call(client, "file.sync", [wfd])
    assert {:ok, :ok} == Test.Client.call(client, "file.close", [wfd])
    assert {:ok, :ok} == Test.Client.call(client, "file.close", [rfd])
  end

  test "Close write end when reading returns inmediately" do
    {:ok, wfd, rfd} = Pipe.pipe

    task1 = Task.async(fn ->
      Pipe.read(rfd) # should block until somthing is written, or closed w
    end)

    :timer.sleep(50) # allow task1 to start
    Pipe.close(wfd)

    Task.await(task1, 100)

    # now try to read again, should get closed
    assert Pipe.read(rfd) == {:ok, false}

    Pipe.close(rfd)
  end
end
