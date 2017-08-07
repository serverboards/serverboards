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
        end
    end
  end
  def read(fd, options \\ []) do
    options = Enum.into(options, %{})
    with {:read, pid} <- lookup(fd) do
      GenServer.call( pid, {:read, options})
    end
  end
  def sync(fd) do
    with {:read, pid} <- lookup(fd) do
      GenServer.call(pid, {:sync})
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
  def init({wfd, rfd, options}) do
    Process.monitor(options.parent)
    {:ok, _} = Registry.register( __MODULE__, wfd, {:write, self()})
    {:ok, _} = Registry.register( __MODULE__, rfd, {:read, self()})

    {:ok, %{
      buffers: [],
      wait_read: [],
      open_fds: [wfd, rfd], # when empty, terminate
      rfd: rfd,
      wfd: wfd,
      wait_empty: [], # to wake up when buffers are empty
      async: options[:async]
    }}
  end

  def handle_call({:write, data, options}, from, state) do
    state = case state.wait_read do
      [] -> # nobody waiting, store the write
        if state.async do
          Serverboards.Event.emit("file.ready[#{inspect state.rfd}]", %{})
        end
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
      [head] ->
        for wait_empty <- state.wait_empty do
          GenServer.reply(wait_empty, :empty)
        end
        {:reply,
          {:ok, head},
          %{ state |
            buffers: [],
            wait_empty: []
          }
        }
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
  def handle_call({:sync, fd}, from, state) do
    if state.wait_empty == [] do
      {:reply, :empty, state}
    else
      {:noreply, %{ state |
        wait_empty: state.wait_empty ++ [from]
      }}
    end
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
