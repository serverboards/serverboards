require Logger

defmodule Serverboards.File.Pipe do
  use GenServer

  @max_buffers 128
  @max_buf_size 32*1024

  @doc ~S"""
  Creates a pipe, returns the write and read fds ({:ok, wfd, rfd})
  """
  def pipe(options \\ []) do
    wfd = UUID.uuid4
    rfd = UUID.uuid4

    #Logger.debug("ew #{inspect Registry.lookup(__MODULE__, wfd)} !-> #{inspect self()}")
    parent = Keyword.get(options, :parent, self())
    options = Keyword.take(options, [:parent])

    {:ok, pid} = GenServer.start_link(__MODULE__, {wfd, rfd, parent}, options )

    Logger.debug("w #{inspect Registry.whereis_name({__MODULE__, wfd})}")
    Logger.debug("r #{inspect Registry.whereis_name({__MODULE__, rfd})}")

    {:ok, wfd, rfd}
  end

  def lookup(fd) do
    case Registry.lookup( __MODULE__, fd) do
      [{_, data}] -> data
      [] -> {:error, :not_found}
    end
  end

  def write(fd, data, options \\ []) when is_binary(data) do
    options = Enum.into(options, %{})
    Logger.debug("me #{inspect self()}")
    if byte_size(data) > @max_buf_size do
      {:error, :buffer_too_large}
    else
      with {:write, pid} <- lookup(fd) do
         GenServer.call( pid, {:write, data, options})
      end
    end
  end
  def read(fd, options \\ []) do
    options = Enum.into(options, %{})
    with {:read, pid} <- lookup(fd) do
      GenServer.call( pid, {:read, options})
    end
  end

  @doc ~S"""
  Closes one end of the connection. Both ends must be closed.
  """
  def close(fd) do
    case lookup( fd ) do
      {:error, :not_found} ->
        {:error, :not_found}
      {_, pid} ->
        GenServer.call( pid, {:close, fd})
    end
  end

  ## Server IMPL
  def init({wfd, rfd, parent}) do
    Process.monitor(parent)
    {:ok, _} = Registry.register( __MODULE__, wfd, {:write, self()})
    {:ok, _} = Registry.register( __MODULE__, rfd, {:read, self()})

    {:ok, %{
      buffers: [],
      wait_read: [],
      open_fds: [wfd, rfd] # when empty, terminate
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
      open_fds: List.delete( state.open_fds, fd )
    }
    :ok == Registry.unregister(__MODULE__, fd)
    if state.open_fds == [] do
      {:stop, :normal, :ok, state}
    else
      {:reply, :ok, state}
    end
  end
  def handle_info({:DOWN, _ref, :process, _pid, _reason}, state) do
    Logger.warn("handle info DOWN")
    {:stop, :normal, state}
  end
  def handle_info(data, state) do
    Logger.warn("handle info: #{inspect data}")
    {:noreply, state}
  end

  def terminate(reason, state) do
    Logger.debug("Terminate file pipe #{inspect reason}")
    for fd <- state.open_fds do
      :ok == Registry.unregister(__MODULE__, fd)
    end
  end
end
