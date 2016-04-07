require Logger

defmodule Serverboards.IO.Cmd do
  use GenServer

  alias Serverboards.IO

  @doc ~S"""
  Runs a command (to properly shlex), and returns the handler to be able to
  comunicate with it

    iex> {:ok, ls} = start_link("test/data/cmd/ls.py")
    iex> call( ls, "ping", ["pong"], 1)
    "pong"
    iex> call( ls, "ping", ["pang"], 2)
    "pang"
    iex> ( Enum.count call( ls, "ls", ["."], 2) ) > 1
    true
    iex> call ls, "invalid"
    ** (Serverboards.MOM.RPC.UnknownMethod) Unknown method "invalid"
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
  def call(cmd, method, params \\ [], id \\ 1) do
    case GenServer.call(cmd, {:call, method, params, id}) do
      {:ok, res} -> res
      {:error, "unknown_method"} -> raise Serverboards.MOM.RPC.UnknownMethod, method: method
      {:error, err} -> raise err
    end
  end

  ## server implementation
  def init({cmd, args, cmdopts}) do
    cmdopts = cmdopts ++ [:stream, :line, :use_stdio, args: args]
    port = Port.open({:spawn_executable, cmd}, cmdopts)
    Logger.debug("Starting command #{cmd} at port #{inspect port}")
    Port.connect(port, self())

    {:ok, client} = IO.Client.start_link(name: "CMD-#{cmd}")
    IO.Client.on_call( client, &call_to_cmd(port, &1, &2, &3) )
    IO.Client.set_user( client, %{ email: "system@serverboards.io", perms: []} )
    IO.Client.ready( client )

    state=%{
      cmd: cmd,
      port: port,
      client: client,
    }
    {:ok, state}
  end

  def handle_call({:call, method, params, id}, from, state) do
    alias Serverboards.MOM.RPC
    RPC.cast( state.client.to_client, method, params, id, fn res ->
      GenServer.reply(from, res)
    end)
    {:noreply, state}
  end


  def handle_info({ _, {:data, {:eol, line}}}, state) do
    Logger.debug("Got line: <#{line}>")
    client=state.client

    case line do
      '' ->
        :empty
      line ->
        case JSON.decode( line ) do
          {:ok, %{ "method" => method, "params" => params, "id" => id}} ->
            IO.Client.call(client, method, params, id, &reply_to_cmd(state.port, id, &1))
          {:ok, %{ "method" => method, "params" => params}} ->
            IO.Client.event(client, method, params)
          {:ok, %{ "result" => result, "id" => id}} ->
            IO.Client.reply(client, result, id)
          {:ok, %{ "error" => params, "id" => id}} ->
            IO.Client.error(client, params, id)
          _ ->
            Logger.debug("Invalid message from client: #{line}")
            raise Protocol.UndefinedError, "Invalid message from client. Closing."
        end
    end
    {:noreply, state}
  end

  def handle_info(a, state) do
    Logger.debug("Got non managed info #{inspect a}")
    {:noreply, state}
  end

  def handle_cast(a, state) do
    Logger.debug("Got non managed cast #{inspect a}")
    {:noreply, state}
  end

  def handle_call(a, from, state) do
    Logger.debug("Got non managed call #{inspect a}")
    {:reply, :ok, state}
  end


  # Sends a reply to the cmd
  def reply_to_cmd(port, id, res) do
    res = case res do
      {:error, error} ->
        Logger.error("Error on method response: #{inspect error}")
        %{ "error" => error, "id" => id}
      {:ok, res} ->
        %{ "result" => res, "id" => id}
    end
    {:ok, res} = JSON.encode( res )
    Logger.debug("Got answer #{res}, writing to #{inspect port}")

    Port.command(port, "#{res}\n")
  end

  def call_to_cmd(port, method, params, id) do
    jmsg = %{ method: method, params: params }

    # maybe has id, maybe not.
    jmsg = if id do
      Map.put( jmsg , :id, id )
    else
      jmsg
    end

    # encode and send
    {:ok, json} = JSON.encode( jmsg )
    Port.command(port, "#{json}\n")
  end
end
