require Logger

defmodule Serverboards.IO.Cmd do
  use GenServer

  alias Serverboards.MOM.RPC

  @doc ~S"""
  Runs a command (to properly shlex), and returns the handler to be able to
  comunicate with it

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
    GenServer.start_link(__MODULE__, {cmd, args, cmdopts}, opts)
  end

  def stop(cmd) do
    GenServer.stop(cmd)
  end

  @doc ~S"""
  Performs a call into the command.

  By default uses id 1 as normally its used in synchronous fashion.

  This function is used mainly in testing.
  """
  def call(cmd, method, params \\ []) do
    case GenServer.call(cmd, {:call, method, params}) do
      {:ok, res} -> {:ok, res}
      {:error, "unknown_method"} -> {:error, :unknown_method}
      {:error, err} -> {:error, err}
    end
  end

  ## server implementation
  def init({cmd, args, cmdopts}) do
    cmdopts = cmdopts ++ [:stream, :line, :use_stdio, args: args]
    port = Port.open({:spawn_executable, cmd}, cmdopts)
    Logger.debug("Starting command #{cmd} at port #{inspect port}")
    Port.connect(port, self())

    {:ok, client} = RPC.Client.start_link(
      &Port.command(port, &1),
      name: "CMD-#{cmd}"
      )
    RPC.Client.set( client, :user, %{ email: "system@serverboards.io", perms: []} )

    state=%{
      cmd: cmd,
      port: port,
      client: client,
      maxid: 1
    }
    {:ok, state}
  end

  def handle_call({:call, method, params}, from, state) do
    id = state.maxid
    alias Serverboards.MOM.RPC
    RPC.cast( state.client.to_client, method, params, id, fn res ->
      GenServer.reply(from, res)
    end)
    {:noreply, %{ state | maxid: state.maxid+1 } }
  end

  def handle_info({ _, {:data, {:eol, line}}}, state) do
    RPC.Client.parse_line(state.client, line)
    {:noreply, state}
  end

end
