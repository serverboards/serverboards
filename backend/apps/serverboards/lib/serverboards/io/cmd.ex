require Logger

defmodule Serverboards.IO.Cmd do
  use GenServer

  alias MOM.RPC

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

  ## server implementation
  def init({cmd, args, cmdopts, perms}) do
    Process.flag(:trap_exit, true)
    server = self

    cmdopts = cmdopts ++ [:stream, :line, :use_stdio, args: args]
    port = Port.open({:spawn_executable, cmd}, cmdopts)
    Logger.debug("Starting command #{cmd} at port #{inspect port}")
    Port.connect(port, server)

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
        email: :plugin,
        name: cmd,
        perms: (if perms, do: perms, else: []),
        groups: []
      }
    )

    state=%{
      cmd: cmd,
      port: port,
      client: client,
    }
    {:ok, state}
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
    case RPC.Client.parse_line(state.client, line) do
      {:error, e} ->
        Logger.error("Error parsing line: #{inspect e}")
        Logger.debug("Offending line is: #{line}")
      _ -> nil
    end
    {:noreply, state}
  end
  def handle_info({:EXIT, port, :normal}, state) when is_port(port) do
    {:stop, :normal, state}
  end
  def handle_info({:EXIT, port, reason}, state) when is_port(port) do
    Logger.warn("Command exit, not expected: #{reason}")
    {:stop, reason, state}
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
