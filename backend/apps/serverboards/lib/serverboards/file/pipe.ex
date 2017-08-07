require Logger

defmodule Serverboards.File.Pipe do
  use GenServer

  @max_buffers 128
  @max_buf_size 32*1024


  def start_link(wfd, rfd, options \\ []) do
    GenServer.start_link( __MODULE__, {wfd, rfd}, options )
  end

  @doc ~S"""
  Creates a pipe, returns the write and read fds ({:ok, wfd, rfd})
  """
  def pipe() do
    wfd = UUID.uuid4
    rfd = UUID.uuid4

    Logger.debug("ew #{inspect Registry.lookup(__MODULE__, wfd)} !-> #{inspect self()}")

    {:ok, pid} = start_link( wfd, rfd, [] )

    Logger.debug("w #{inspect Registry.whereis_name({__MODULE__, wfd})}")
    Logger.debug("r #{inspect Registry.whereis_name({__MODULE__, rfd})}")

    {:ok, wfd, rfd}
  end

  def write(fd, data, options \\ []) when is_binary(data) do
    options = Enum.into(options, %{})
    Logger.debug("me #{inspect self()}")
    if byte_size(data) > @max_buf_size do
      {:error, :buffer_too_large}
    else
      [{_, {:write, pid}}] = Registry.lookup( __MODULE__, fd )
      GenServer.call( pid, {:write, data, options})
    end
  end
  def read(fd, options \\ []) do
    options = Enum.into(options, %{})
    [{_, {:read, pid}}] = Registry.lookup( __MODULE__, fd )
    GenServer.call( pid, {:read, options})
  end

  @doc ~S"""
  Closes one end of the connection. Both ends must be closed.
  """
  def close(fd) do
    case Registry.lookup( __MODULE__, fd ) do
      [{_, {_, pid}}] ->
        GenServer.call( pid, {:close, fd})
      [] ->
        {:error, :not_found}
    end
  end

  ## Server IMPL
  def init({wfd, rfd}) do
    Logger.debug("Start")
    {:ok, _} = Registry.register( __MODULE__, wfd, {:write, self()})
    {:ok, _} = Registry.register( __MODULE__, rfd, {:read, self()})

    {:ok, %{
      buffers: [],
      wait_read: [],
      closed: 0 # when 2, terminate
    }}
  end

  def handle_call({:write, data, options}, from, state) do
    state = case state.wait_read do
      [] -> # nobody waiting, store the write
        %{ state |
          buffers: state.buffers ++ [data]
        }
      [ head | tail ] -> # somebody waiting, give answer
        GenServer.reply(head, {:ok, data})
        %{ state |
          wait_read: tail
        }
    end

    {:reply, :ok, state }
  end
  def handle_call({:read, %{ async: true }}, from, state) do
    case state.buffers do
      [head | tail ] ->
        {:reply,
          {:ok, head},
          %{ state |
            buffers: tail
          }
        }
      [] ->
        {
          :reply,
          {:ok, nil},
          state
        }
    end
  end
  def handle_call({:read, options}, from, state) do
    case state.buffers do
      [head | tail ] ->
        {:reply,
          {:ok, head},
          %{ state |
            buffers: tail
          }
        }
      [] ->
        {:noreply, %{ state |
          wait_read: state.wait_read ++ [from]
        } }
    end
  end
  def handle_call({:close, fd}, _from, state) do
    state = %{ state |
      closed: state.closed + 1
    }
    :ok == Registry.unregister(__MODULE__, fd)
    if state.closed == 2 do
      {:stop, :normal, :ok, state}
    else
      {:reply, :ok, state}
    end
  end

  def terminate(reason, state) do
    Logger.debug("Terminate file pipe #{inspect reason}")
  end
end
