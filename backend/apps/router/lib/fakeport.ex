require Logger

defmodule FakePort do
  use GenServer
  defstruct [
    pid: nil
  ]

  alias Serverboards.Router.Message

  def write_msg(%FakePort{ pid: port}, msg) do
    Logger.info("Write test message #{inspect msg}")

    r=GenServer.call(port, {:inject_answer, msg})
    Logger.info("#{inspect r}")
    r
  end

  def start_link do
    {:ok, pid} = GenServer.start_link(__MODULE__, :ok, [])
    {:ok, %FakePort{ pid: pid }}
  end

  def inject_call(%FakePort{ pid: port}, msg) do
    GenServer.call(port, {:inject_msg, msg})
  end

  def inject_call(%FakePort{ pid: port}, method, payload) do
    GenServer.call(port, {:inject_msg, Message.new( method, payload, port )})
  end

  def read_msg(%FakePort{ pid: port}) do
    GenServer.call(port, {:read_msg})
  end

  def wait_answer(%FakePort{pid: port}) do
    GenServer.call(port, {:read_answer})
  end

  ## server impl
  def init(:ok) do
    {:ok, %{
      last_msg: nil,
      last_client: nil,
      last_ans: nil
    }}
  end

  def handle_call({:inject_msg, msg}, _, state) do
    Logger.debug("Inject #{inspect msg}")
    if state.last_client do
      Logger.debug("Fast reply")
      GenServer.reply(state.last_client, msg)
    end
    Logger.debug("Store for later")
    {:reply, :ok, %{state | last_msg: msg, last_client: nil }}
  end

  def handle_call({:read_msg}, from, state) do
    if state.last_msg do
      Logger.debug("Fast reply, was in mem")
      {:reply, state.last_msg, %{state | last_msg: nil }}
    else
      Logger.debug("Block, no msg waiting")
      {:noreply, %{state | last_client: from }}
    end
  end

  def handle_call({:inject_answer, msg}, _, state) do
    Logger.debug("Inject #{inspect msg}")
    if state.last_ans do
      Logger.debug("Fast reply")
      GenServer.reply(state.last_client, msg)
    end
    Logger.debug("Store for later")
    {:reply, :ok, %{state | last_ans: msg, last_client: nil }}
  end


  def handle_call({:read_answer}, from, state) do
    if state.last_ans do
      Logger.debug("Fast answer, was in mem")
      {:reply, state.last_ans, %{state | last_ans: nil }}
    else
      Logger.debug("Block, no answer waiting")
      {:noreply, %{state | last_client: from }}
    end
  end
end

defimpl Serverboards.Router.Port, for: FakePort do
  def write_msg(port, msg), do: FakePort.write_msg(port, msg)
  def read_msg(port), do: FakePort.read_msg(port)
end
