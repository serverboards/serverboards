require Logger

defmodule Serverboards.IO.Cmd do
  use GenServer

  alias MOM.RPC

  @ratelimit_bucket_size 100 # 100 slots
  @ratelimit_bucket_rate 1000 # ms
  @ratelimit_bucket_add 50 # add X buckets every rate ms, lower better latency,
                           # more means more burstines alas uses lees resources.

  # check https://en.wikipedia.org/wiki/Token_bucket forthe algorithm details
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
    GenServer.stop(cmd)
  end

  @doc ~S"""
  Performs a call into the command.

  This function is used mainly in testing as it has a timeout of 5s.
  """
  def call(cmd, method, params \\ []) do
    # 24h timeout
    case GenServer.call(cmd, {:call, method, params}, 24 * 60 * 60 * 1000) do
      {:ok, res} -> {:ok, res}
      {:error, err} -> {:error, err}
    end
  end

  #def cast(cmd, method, params, cont) do
  #  GenServer.cast(cmd, {:cast, method, params, cont})
  #end

  @doc ~S"""
  Returns the associated client
  """
  def client(cmd) do
    GenServer.call(cmd, {:client})
  end

  # returns the string length from the list_lines
  defp list_line_length(l) when is_binary(l) do
    byte_size(l)
  end
  defp list_line_length([l | rest]) when is_binary(l) do
    list_line_length(l) + list_line_length(rest)
  end
  defp list_line_length(l) when is_list(l) do # when is char list (as from stdin)
    Enum.count(l)
  end

  ## server implementation
  def init({cmd, args, cmdopts, perms}) do
    Process.flag(:trap_exit, true)
    server = self

    cmdopts = cmdopts ++ [:stream, :line, :use_stdio, args: args]
    port = Port.open({:spawn_executable, cmd}, cmdopts)
    Port.connect(port, server)
    Logger.debug("Starting command #{cmd} at port #{inspect port}")

    {:ok, client} = RPC.Client.start_link [
        writef: fn line ->
          #Logger.debug("Wl #{inspect server} #{inspect line} #{inspect Process.alive?(server)}")
          GenServer.call(server, {:write_line, line})
        end,
        name: "CMD-#{cmd}"
      ]
    Serverboards.Auth.client_set_user(
      client,
      %{
        email: "cmd/#{cmd}",
        name: cmd,
        perms: (if perms, do: perms, else: []),
        groups: []
      }
    )
    {:ok, timer} = :timer.send_interval(@ratelimit_bucket_rate, self, :ratelimit_bucket_add)
    Logger.debug("Timer is #{inspect timer}")

    state=%{
      cmd: cmd,
      port: port,
      client: client,
      line: [],
      ratelimit: @ratelimit_bucket_size,
      ratelimit_skip: 0,
    }
    {:ok, state}
  end

  def terminate(reason, state) do
    Logger.debug("Terminate CMD #{inspect state.cmd}")
    kill(state.port)
    #Port.close(state.port)
    {:ok}
  end

  def kill(port) do
    # manual kill.. should be better way FIXME
    case Port.info(port, :os_pid)  do
      {:os_pid, pid} ->
        :os.cmd(String.to_charlist("kill #{pid}"))
        for i <- 1..5 do
          if Port.info(port, :os_pid) != nil do
            :timer.sleep(200)
            :os.cmd(String.to_charlist("kill #{pid}"))
          end
        end
        if Port.info(port, :os_pid) != nil do
          Logger.debug("Force kill pid #{inspect pid}")
          :timer.sleep(200)
          :os.cmd(String.to_charlist("kill -9 #{pid}"))
        end
      nil -> :ok
    end
    :ok
  end

  defp rate_limit_wait(state) do
    #Logger.debug("Ratelimit count #{state.ratelimit}")
    {ratelimit, skip} = if state.ratelimit <= 0 do
      Logger.debug("Messages arriving too fast from CMD #{inspect state.cmd}. Wait #{inspect @ratelimit_bucket_rate} ms", cmd: state.cmd)
      :timer.sleep(@ratelimit_bucket_rate) # sleep here.
      # set the state as one has been processed, added the buckets, but also
      # mark skip later add.
      # IO may have a looong queue of messages waiting before getting to the
      # interval timer (and then they may be all at a time). Setting how
      # many to skip helps the have always the algorithm in sync.
      {@ratelimit_bucket_add - 1, state.ratelimit_skip + 1}
    else
      {state.ratelimit - 1, state.ratelimit_skip}
    end

    %{ state | ratelimit: ratelimit, ratelimit_skip: skip }
  end

  def handle_call({:write_line, line}, _from, state) do
    # If fails, makes the cmd exit. And by failing call, quite probably caller too. (Client)
    res = Port.command(state.port, line)
    {:reply, res, state}
  end
  def handle_call({:call, method, params}, from, state) do
    #Logger.debug("Call #{method}")
    RPC.Client.cast( state.client, method, params, fn res ->
      #Logger.debug("Response for #{method}: #{inspect res}")
      GenServer.reply(from, res)
    end)
    {:noreply, state }
  end
  def handle_call({:client}, _from, state) do
    {:reply, state.client, state}
  end
  def handle_call({:reply, cont, res}, _from, state) do
    ret = cont.(res)
    {:reply, ret, state}
  end

  def handle_cast({:cast, method, params, cont}, state) do
    server = self
    RPC.Client.cast( state.client, method, params, fn res ->
      Logger.debug("Got answer #{inspect server} #{inspect self}, #{inspect res}")
      try do
        GenServer.call(server, {:reply, cont, res})
      catch
        :exit, _ ->
          # this means it crashed handling the RPC.Client.Cast, as would not get to call it if not running
          Logger.error("Error with the reply, maybe cmd crashed while processing #{method}.", cmd: state.cmd, method: method)
          cont.({:error, :abort_on_method_call})
      end
      :ok
    end)
    {:noreply, state}
  end

  def handle_info({ _, {:data, {:eol, line}}}, state) do
    state = rate_limit_wait(state)

    line = to_string([state.line, line])
    case RPC.Client.parse_line(state.client, line) do
      {:error, e} ->
        Logger.error("Error parsing line: #{inspect e}")
        Logger.debug("Offending line is: #{line}")
      _ -> nil
    end
    {:noreply, %{ state | line: [] }}
  end
  def handle_info({ _, {:data, {:noeol, line}}}, state) do
    state = rate_limit_wait(state)

    line = [state.line, line]
    if list_line_length(line) > (1024*8) do # 8kb line.. long one indeed.
      {:stop, :too_long_line}
    else
      {:noreply, %{ state | line: line }}
    end
  end
  def handle_info({:EXIT, port, :normal}, state) when is_port(port) do
    {:stop, :normal, state}
  end
  def handle_info({:EXIT, port, reason}, state) when is_port(port) do
    Logger.warn("Command exit, not expected: #{reason}")
    {:stop, reason, state}
  end

  def handle_info(:ratelimit_bucket_add, state) do
    if state.ratelimit_skip > 0 do
      {:noreply, %{ state | ratelimit_skip: state.ratelimit_skip - 1 }}
    else
      ratelimit = state.ratelimit + @ratelimit_bucket_add
      ratelimit = if state.ratelimit > @ratelimit_bucket_size do
        @ratelimit_bucket_size
      else
        state.ratelimit
      end

      {:noreply, %{ state |
        ratelimit: ratelimit}}
    end
  end
  def handle_info({:EXIT, _pid, :normal}, state) do
    {:noreply, state}
  end
  def handle_info(any, state) do
    Logger.warn("Command got info #{inspect any}")
    {:noreply, state}
  end
  def handle_call(any, state) do
    Logger.warn("Command got call #{inspect any}")
    {:noreply, state}
  end

end
