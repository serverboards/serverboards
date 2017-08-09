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
    options = Enum.into(options, %{})
    parent = Map.get(options, :parent, self())
    options = Map.put(options, :parent, parent)

    {:ok, pid} = GenServer.start_link(__MODULE__, {wfd, rfd, options}, [] )

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
    cond do
      byte_size(data) > @max_buf_size ->
        {:error, :buffer_too_large}
      data == "" ->
        {:error, :empty_data}
      true ->
        with {:write, pid} <- lookup(fd) do
          GenServer.call( pid, {:write, data, options})
        else
          {:error, :not_found} -> {:ok, -1}
          {:read, pid} -> {:ok, -1} # write to read
          other -> other
        end
    end
  end
  def read(fd, options \\ []) do
    options = Enum.into(options, %{})
    with {:read, pid} <- lookup(fd) do
      GenServer.call( pid, {:read, options}, 600_000)
    else
      {:error, :not_found} -> {:ok, -1}
      {:write, pid} -> {:ok, -1} # read from write
      other -> other
    end
  end
  def sync(fd) do
    with {_, pid} <- lookup(fd) do
      GenServer.call(pid, {:sync})
    end
  end
  def fcntl(fd, options) do
    options = Enum.into(options, %{})
    with {_, pid} <- lookup(fd) do
      GenServer.call(pid, {:fcntl, options})
    end
  end

  @doc ~S"""
  Closes one end of the connection. Both ends must be closed.
  """
  def close(fd) do
    case lookup( fd ) do
      {:error, :not_found} ->
        {:ok, "already_closed"} # if already cloed, do nothing, idempotent
      {_, pid} ->
        GenServer.call( pid, {:close, fd})
    end
  end

  ## Server IMPL
  def init({wfd, rfd, options}) do
    Process.monitor(options.parent)
    {:ok, _} = Registry.register( __MODULE__, wfd, {:write, self()})
    {:ok, _} = Registry.register( __MODULE__, rfd, {:read, self()})

    {:ok, %{
      buffers: [],
      wait_read: [],
      wait_write: [],
      open_fds: [wfd, rfd], # when empty, terminate
      rfd: rfd,
      wfd: wfd,
      wait_empty: [], # to wake up when buffers are empty
      async: options[:async],
      max_buffers: Map.get(options, :max_buffers, @max_buffers),
    }}
  end

  # If there is any write waiting, wake it up, add data to queues
  defp wakeup_write(state) do
    case state.wait_write do
      [ {from, data} | tail ] ->
        GenServer.reply(from, byte_size(data))
        %{ state |
          wait_write: tail,
          buffers: state.buffers ++ [data]
        }
      [] ->
        state
    end
  end

  def handle_call({:write, data, options}, from, state) do
    if state.max_buffers == 0 do
      if options[:nonblock] do
        {:reply, 0, state}
      else
        {:noreply, %{ state |
          wait_write: state.wait_write ++ [{from, data}]
        }}
      end
    else
      state = case state.wait_read do
        [] -> # nobody waiting, store the write
          if state.async do
            Serverboards.Event.emit("file.ready[#{inspect state.rfd}]", %{})
          end
          %{ state |
            buffers: state.buffers ++ [data],
            max_buffers: state.max_buffers - 1
          }
        [ head | tail ] -> # somebody waiting, give answer
          GenServer.reply(head, {:ok, data})
          %{ state |
            wait_read: tail,
          }
      end
      {:reply, byte_size(data), state }
    end
  end
  def handle_call({:read, options}, from, state) do
    case state.buffers do
      [head] -> # have only one buffer left
        # wake up sync calls
        for wait_empty <- state.wait_empty do
          GenServer.reply(wait_empty, :ok)
        end
        # and process read
        state = wakeup_write(%{ state | buffers: [] })
        {:reply,
          {:ok, head},
          %{ state |
            wait_empty: [],
            max_buffers: state.max_buffers + 1
          }
        }
      [head | tail ] -> # have several buffers left
        state = wakeup_write(%{ state | buffers: tail })
        {:reply,
          {:ok, head},
          %{ state |
            max_buffers: state.max_buffers + 1
          }
        }
      [] -> # no data ready, may block or not
        if options[:nonblock] do
          {
            :reply,
            {:ok, ""},
            state
          }
        else
          {:noreply, %{ state |
            wait_read: state.wait_read ++ [from]
          } }
        end
    end
  end
  def handle_call({:close, fd}, _from, state) do
    if state.async do
      Serverboards.Event.emit("file.closed[#{fd}]", %{})
    end
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
  def handle_call({:sync}, from, state) do
    if state.wait_empty == [] do
      {:reply, :ok, state}
    else
      {:noreply, %{ state |
        wait_empty: state.wait_empty ++ [from]
      }}
    end
  end
  def handle_call({:fcntl, options}, from, state) do
    {:reply, :ok, %{ state |
      async: Map.get(options, :async, state[:async])
      }}
  end
  def handle_info({:DOWN, _ref, :process, _pid, _reason}, state) do
    {:stop, :normal, state}
  end
  def handle_info(data, state) do
    Logger.warn("Unhandled file.pipe info: #{inspect data}")
    {:noreply, state}
  end

  def terminate(reason, state) do
    for fd <- state.open_fds do
      if state.async do
        Serverboards.Event.emit("file.closed[#{fd}]", %{})
      end
      :ok == Registry.unregister(__MODULE__, fd)
    end
  end
end
