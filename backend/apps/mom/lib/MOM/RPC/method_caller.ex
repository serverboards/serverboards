require Logger

defmodule Serverboards.MOM.RPC.MethodCaller do
  @moduledoc ~S"""
  This module stores methods to be called later.

  They are stored in an execute efficient way, and allow to have a list
  of methods to allow introspection (`dir` method).

  Can be connected with a RPC gateway with `add_method_caller`

  ## Example

    iex> alias Serverboards.MOM.RPC.MethodCaller
    iex> {:ok, mc} = MethodCaller.start_link
    iex> MethodCaller.add_method mc, "ping", fn _ -> "pong" end, async: false
    iex> MethodCaller.call mc, "ping", []
    "pong"
    iex> MethodCaller.call mc, "dir", []
    ["dir", "ping"]

  """

  alias Serverboards.MOM.RPC

  def start_link do
    {:ok, pid} = Agent.start_link fn -> %{ methods: %{}, mc: [] } end

    add_method pid, "dir", fn _ ->
      __dir(pid)
    end, async: false

    {:ok, pid}
  end

  def __dir(pid) do
    st = Agent.get pid, &(&1)
    local = st.methods
      |> Enum.map(fn {name, _} ->
        name
        end)
    other = Enum.flat_map( st.mc, &__dir(&1) )
    Enum.uniq Enum.sort( local ++ other )
  end

  @doc ~S"""
  Adds a method to be called later.

  Options may be:

  * `async`, default true. Execute in another task, returns a promise.
  """
  def add_method(pid, name, f, options \\ []) do
    Agent.update pid, fn st ->
      %{ st | methods: Map.put(st.methods, name, {f, options})}
    end
    :ok
  end

  def add_method_caller(pid, pid) do
    raise "Cant add a method caller to itself."
  end
  def add_method_caller(pid, nmc) do
    Agent.update pid, fn st ->
      %{ st | mc: st.mc ++ [nmc] }
    end
    :ok
  end

  @doc ~S"""
  Calls a method by name.

  Waits for execution always. Independent of async. Returns the value of
  executing the method,
  """
  def call(pid, method, params) do
    case __call(pid, method, params) do
      {:ok, ret} -> ret
      {:error, :unknown_method} -> raise RPC.UnknownMethod, method: method
      {:error, e} -> raise e
    end
  end

  # same as call, but return {:ok, ret} or {:error, err}, easier to compose
  defp __call(pid, method, params) do
    #Logger.debug("Fast call #{method}")
    st = Agent.get pid, &(&1)
    case Map.get st.methods, method do
      {f, _} ->
        {:ok, f.(params)}
      nil ->
        Enum.reduce_while st.mc, nil, fn mc, acc ->
          case MethodCaller.__call(mc, method, params) do
            {:ok, ret} -> {:stop, ret}
            {:error, :unknown_method} -> {:cont, nil}
            e -> e
          end
        end
    end
  end

  @doc ~S"""
  Calls the method and calls the callback with the result.

  If the method was async, it will be run in another task, if it was sync,
  its run right now.

  If the method does not exists, returns :nok, if it does, returns :ok.

  Callback is a function that can receive {:ok, value} or {:error, %Exception{...}}

  Possible errors:
   * :unknown_method
   * :bad_arity
  """
  def cast(pid, method, params, cb) do
    st = Agent.get pid, &(&1)
    case Map.get st.methods, method do
      {f, options} ->
        # Calls the function and the callback with the result, used in async and sync.
        call_f = fn ->
          try do
            v=f.(params)
            cb.({:ok, v })
          rescue
            Serverboards.MOM.RPC.UnknownMethod ->
              cb.({:error, :unknown_method})
            CaseClauseError ->
              cb.({:error, :bad_arity})
            BadArityError ->
              cb.({:error, :bad_arity})
            e ->
              cb.({:error, e})
            end
        end

        # sync or async
        if Keyword.get(options, :async, true) do
          Task.async fn -> call_f.() end
        else
          call_f.()
        end

        # found.
        :ok
      nil ->
        # Look for it at method callers
        #Logger.debug("Call cast from #{inspect pid} to #{inspect st.mc}")
        cast_mc(st.mc, method, params, cb)
    end
  end

  defp cast_mc([], _, _, cb) do # end of search, :unknown_method
    # Just do nothing here, will backgtrack and do the right thing.
    :nok
  end

  defp cast_mc([h | t], method, params, cb) do
    #Logger.debug("Cast mc #{inspect h}")
    cast(h, method, params, fn
      # Keep searching for it
      {:error, :unknown_method} ->
        cast_mc(t, method, params, cb)
      # done, callback with whatever.
      other ->
        cb.(other)
    end)
  end

end
