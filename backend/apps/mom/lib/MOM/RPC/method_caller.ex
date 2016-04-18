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
    iex> MethodCaller.call mc, "ping", [], nil
    "pong"
    iex> MethodCaller.call mc, "dir", [], nil
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
  * `context`, the called function will be called with the client context. It is a Serverboards.MOM.MapAgent
  """
  def add_method(pid, name, f, options \\ []) do
    Agent.update pid, fn st ->
      %{ st | methods: Map.put(st.methods, name, {f, options})}
    end
    :ok
  end

  @doc ~S"""
  Method callers can be chained, so that if current does not resolve, try on another

  This another caller can be even shared between several method callers.

  Example:

  I will create three method callers, so that a calls, and b too. Method can
  be shadowed at parent too.

    iex> alias Serverboards.MOM.RPC.{MethodCaller, Context}
    iex> {:ok, a} = MethodCaller.start_link
    iex> {:ok, b} = MethodCaller.start_link
    iex> {:ok, c} = MethodCaller.start_link
    iex> MethodCaller.add_method a, "a", fn _ -> :a end
    iex> MethodCaller.add_method b, "b", fn _ -> :b end
    iex> MethodCaller.add_method c, "c", fn _ -> :c end
    iex> MethodCaller.add_method c, "c_", fn _, context -> {:c, Context.get(context, :user, nil)} end, context: true
    iex> MethodCaller.add_method_caller a, c
    iex> MethodCaller.add_method_caller b, c
    iex> {:ok, context} = Context.start_link
    iex> Context.set context, :user, :me
    iex> MethodCaller.call a, "c", [], context
    :c
    iex> MethodCaller.call a, "c_", [], context
    {:c, :me}
    iex> MethodCaller.call b, "c", [], context
    :c
    iex> MethodCaller.call b, "c_", [], context
    {:c, :me}
    iex> MethodCaller.add_method a, "c", fn _ -> :shadow end
    iex> MethodCaller.call a, "c", [], context
    :shadow
    iex> MethodCaller.call b, "c", [], context
    :c

  """
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
  def call(pid, method, params, context) do
    case __call(pid, method, params, context) do
      {:ok, ret} -> ret
      {:error, :unknown_method} -> raise RPC.UnknownMethod, method: method
      {:error, e} -> raise e
      #other -> Logger.error(inspect other)
    end
  end

  # same as call, but return {:ok, ret} or {:error, err}, easier to compose
  defp __call(pid, method, params, context) do
    #Logger.debug("Fast call #{method}")
    st = Agent.get pid, &(&1)
    case Map.get st.methods, method do
      {f, options} ->
        if Keyword.get(options, :context, false) do
          {:ok, f.(params, context)}
        else
          {:ok, f.(params)}
        end
      nil ->
        Enum.reduce_while st.mc, nil, fn mc, _acc ->
          case __call(mc, method, params, context) do
            {:ok, ret} -> {:halt, {:ok, ret}}
            {:error, :unknown_method} -> {:cont, nil}
            {:error, other} -> {:halt, {:error, other}}
            #other -> Logger.error(inspect other)
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

  ## Examples

    iex> alias Serverboards.MOM.RPC.{Context, MethodCaller}
    iex> {:ok, mc} = MethodCaller.start_link
    iex> MethodCaller.add_method mc, "echo", fn [what], context -> "#{what}#{Context.get(context, :test, :fail)}" end, context: true
    iex> {:ok, context} = Context.start_link
    iex> Context.set context, :test, "ok"
    iex> MethodCaller.call mc, "echo", ["test_"], context
    "test_ok"

  """
  def cast(pid, method, params, context, cb) do
    st = Agent.get pid, &(&1)
    case Map.get st.methods, method do
      {f, options} ->
        # Calls the function and the callback with the result, used in async and sync.
        call_f = fn ->
          try do
            v = if Keyword.get(options, :context, false) do
              #Logger.debug("Calling with context #{inspect f} #{inspect options}")
              f.(params, context)
            else
              #Logger.debug("Calling without context #{inspect f}")
              f.(params)
            end

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
        cast_mc(st.mc, method, params, context, cb)
    end
  end

  defp cast_mc([], _, _, _, _cb) do # end of search, :unknown_method
    # Just do nothing here, will backtrack and do the right thing.
    :nok
  end

  defp cast_mc([h | t], method, params, context, cb) do
    #Logger.debug("Cast mc #{inspect h}")
    cast(h, method, params, context, fn
      # Keep searching for it
      {:error, :unknown_method} ->
        cast_mc(t, method, params, context, cb)
      # done, callback with whatever.
      other ->
        cb.(other)
    end)
  end

end
