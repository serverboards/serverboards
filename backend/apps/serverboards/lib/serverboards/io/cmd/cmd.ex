require Logger

defmodule Serverboards.IO.Cmd do
  use GenServer

  alias MOM.RPC

  # 100 slots
  @ratelimit_bucket_size 100
  # ms
  @ratelimit_bucket_rate 100
  # add X buckets every rate ms, lower better latency,
  @ratelimit_bucket_add 50
  # more means more burstines alas uses lees resources.

  # check https://en.wikipedia.org/wiki/Token_bucket for the algorithm details
  # rate is variable from a max of (rate / size) to min of (rate / add)

  @doc ~S"""
  Runs a command (to properly shlex), and returns the handler to be able to
  comunicate with it

  ## Example

    iex> {:ok, ls} = start_link("test/data/cmd/ls.py")
    iex> call( ls, "ping", ["pong"])
    {:ok, "pong"}
    iex> call( ls, "ping", ["pang"])
    {:ok, "pang"}
    iex> {:ok, ls_res} = call( ls, "ls", ["."])
    iex> ( Enum.count ls_res ) > 1
    true
    iex> call ls, "invalid"
    {:error, :unknown_method}
    iex> stop(ls)
    :ok

  """
  def start_link(cmd, args \\ [], cmdopts \\ [], opts \\ []) do
    GenServer.start_link(__MODULE__, {cmd, args, cmdopts, opts[:perms]}, opts)
  end

  def stop(cmd) do
    # Logger.debug("Stopping CMD #{inspect cmd}")
    GenServer.stop(cmd)
  end

  @doc ~S"""
  Performs a call into the command.
  """
  def call(cmd, method, params \\ []) do
    # 24h timeout
    try do
      RPC.Client.call(client(cmd), method, params)
    catch
      :exit, {reason, _} ->
        Logger.error(
          "Command exited while processing method call: #{inspect(cmd)}.#{inspect(method)}: #{
            inspect(reason)
          }",
          method: method,
          reason: reason
        )

        {:error, :exit}
    end
  end

  # def cast(cmd, method, params, cont) do
  #  GenServer.cast(cmd, {:cast, method, params, cont})
  # end

  @doc ~S"""
  Returns the associated client
  """
  def client(cmd) do
    GenServer.call(cmd, {:get, :client})
  end

  # returns the string length from the list_lines
  defp list_line_length(l) when is_binary(l) do
    byte_size(l)
  end

  defp list_line_length([l | rest]) when is_binary(l) do
    list_line_length(l) + list_line_length(rest)
  end

  # when is char list (as from stdin)
  defp list_line_length(l) when is_list(l) do
    Enum.count(l)
  end

  def write_line(port, _client, line) do
    # if state.debug do
    # Logger.debug("CMD // #{Path.basename(cmd)}> #{line} #{inspect(Port.info(port))}")

    # end

    Port.command(port, line)
  end

  ## server implementation
  def init({cmd, args, cmdopts, perms}) do
    Process.flag(:trap_exit, true)
    server = self()

    cmdopts = cmdopts ++ [:stream, :line, :use_stdio, args: args]
    # Logger.debug("Start command with opts: #{inspect cmdopts}")
    port = Port.open({:spawn_executable, cmd}, cmdopts)
    Port.connect(port, server)
    # Logger.debug("Starting command #{cmd} at port. pid #{inspect self()}")

    {:ok, client} = RPC.Client.start_link(writef: {__MODULE__, :write_line, [port]})

    MOM.RPC.Client.add_method(client, "debug", fn [onoff] ->
      GenServer.call(server, {:debug, onoff})
    end)

    Serverboards.Auth.client_set_user(
      client,
      %{
        email: "cmd/#{cmd}",
        name: cmd,
        perms: if(perms, do: perms, else: []),
        groups: []
      }
    )

    {:ok, timer} = :timer.send_interval(@ratelimit_bucket_rate, self(), :ratelimit_bucket_add)
    # Logger.debug("Timer is #{inspect timer}")

    state = %{
      cmd: cmd,
      port: port,
      client: client,
      line: [],
      ratelimit: @ratelimit_bucket_size,
      ratelimit_skip: 0,
      debug: false,
      timer: timer
    }

    {:ok, state}
  end

  def terminate(:normal, state) do
    Logger.info("Stop #{inspect(state.cmd)} #{inspect(self())}", cmd: state.cmd)
    kill(state.port)
    :timer.cancel(state.timer)
    {:ok}
  end

  def terminate(reason, state) do
    Logger.debug("Terminate CMD #{inspect(reason)} // #{inspect(Path.basename(state.cmd))}")
    kill(state.port)
    :timer.cancel(state.timer)
    {:ok}
  end

  def kill(port) do
    # manual kill.. should be better way FIXME
    case Port.info(port, :os_pid) do
      {:os_pid, pid} ->
        :os.cmd(String.to_charlist("kill #{pid}"))

        for _i <- 1..5 do
          if Port.info(port, :os_pid) != nil do
            :timer.sleep(200)
            :os.cmd(String.to_charlist("kill #{pid}"))
          end
        end

        if Port.info(port, :os_pid) != nil do
          Logger.debug("Force kill pid #{inspect(pid)}")
          :timer.sleep(200)
          :os.cmd(String.to_charlist("kill -9 #{pid}"))
        end

      nil ->
        :ok
    end

    :ok
  end

  defp rate_limit_wait(state) do
    # Logger.debug("Ratelimit count #{state.ratelimit}")
    {ratelimit, skip} =
      if state.ratelimit <= 0 do
        # Logger.debug("Messages arriving too fast from CMD #{inspect state.cmd}. Wait #{inspect @ratelimit_bucket_rate} ms", cmd: state.cmd)
        # sleep here.
        :timer.sleep(@ratelimit_bucket_rate)
        # set the state as one has been processed, added the buckets, but also
        # mark skip later add.
        # IO may have a looong queue of messages waiting before getting to the
        # interval timer (and then they may be all at a time). Setting how
        # many to skip helps the have always the algorithm in sync.
        {@ratelimit_bucket_add - 1, state.ratelimit_skip + 1}
      else
        {state.ratelimit - 1, state.ratelimit_skip}
      end

    %{state | ratelimit: ratelimit, ratelimit_skip: skip}
  end

  def handle_call({:get, :client}, _from, state) do
    {:reply, state.client, state}
  end

  # def handle_call({:reply, cont, res}, _from, state) do
  #   ret = cont.(res)
  #   {:reply, ret, state}
  # end
  def handle_call({:debug, onoff}, _from, state) do
    Logger.debug("Setting debug #{inspect(onoff)}")
    {:reply, {:ok, :ok}, %{state | debug: onoff}}
  end

  # def handle_cast({:cast, method, params, cont}, state) do
  #   server = self()
  #   RPC.Client.cast( state.client, method, params, fn res ->
  #     Logger.debug("Got answer #{inspect server} #{inspect self()}, #{inspect res}")
  #     try do
  #       GenServer.call(server, {:reply, cont, res})
  #     catch
  #       :exit, _ ->
  #         # this means it crashed handling the RPC.Client.Cast, as would not get to call it if not running
  #         Logger.error("Error with the reply, maybe cmd crashed while processing #{method}.", cmd: state.cmd, method: method)
  #         cont.({:error, :abort_on_method_call})
  #     end
  #     :ok
  #   end)
  #   {:noreply, state}
  # end

  def handle_info({_, {:data, {:eol, line}}}, state) do
    state = rate_limit_wait(state)

    line = to_string([state.line, line])

    if state.debug do
      Logger.debug("CMD // #{Path.basename(state.cmd)} // #{inspect(self())}< #{line}")
    end

    case RPC.Client.parse_line(state.client, line) do
      {:error, e} ->
        Logger.error("Error parsing line at #{inspect(state[:cmd])}: #{inspect(e)}")
        Logger.debug("Offending line is: #{line}")

      _ ->
        nil
    end

    {:noreply, %{state | line: []}}
  end

  def handle_info({_, {:data, {:noeol, line}}}, state) do
    # state = rate_limit_wait(state)

    line = [state.line, line]
    # 8kb line.. long one indeed.
    if list_line_length(line) > 1024 * 8 do
      {:stop, :too_long_line}
    else
      {:noreply, %{state | line: line}}
    end
  end

  def handle_info({:EXIT, port, :normal}, state) when is_port(port) do
    Logger.debug("Command exit normal")
    {:stop, :normal, state}
  end

  def handle_info({:EXIT, port, reason}, state) when is_port(port) do
    Logger.warn("Command exit, not expected: #{reason}")
    {:stop, reason, state}
  end

  def handle_info(:ratelimit_bucket_add, state) do
    # Logger.debug("Add bucket to rate limiting")
    if state.ratelimit_skip > 0 do
      {:noreply, %{state | ratelimit_skip: state.ratelimit_skip - 1}}
    else
      ratelimit = state.ratelimit + @ratelimit_bucket_add

      ratelimit =
        if ratelimit > @ratelimit_bucket_size do
          @ratelimit_bucket_size
        else
          ratelimit
        end

      {:noreply, %{state | ratelimit: ratelimit}}
    end
  end

  def handle_info(_any, state) do
    # Logger.warn("Command got info #{inspect any}")
    {:noreply, state}
  end
end
