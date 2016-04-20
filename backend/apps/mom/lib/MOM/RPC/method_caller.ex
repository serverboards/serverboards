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
    {:ok, "pong"}
    iex> MethodCaller.call mc, "dir", [], nil
    {:ok, ["dir", "ping"]}

  """

  alias Serverboards.MOM.RPC

  def start_link do
    {:ok, pid} = Agent.start_link fn -> %{ methods: %{}, mc: [] } end

    add_method pid, "dir", fn _, context ->
      __dir(pid, context)
    end, [async: false, context: true]

    {:ok, pid}
  end

  def __dir(pid, context) when is_pid(pid) do
    st = Agent.get pid, &(&1)
    local = st.methods
      |> Enum.map(fn {name, _} ->
        name
        end)
    other = Enum.flat_map( st.mc, &__dir(&1, context) )
    Enum.uniq Enum.sort( local ++ other )
  end

  def __dir(f, context) when is_function(f) do
    try do
      case f.(%RPC.Message{method: "dir", context: context}) do
        {:ok, l} when is_list(l) -> l
        o ->
          Logger.error("dir dir not return list at #{inspect f}. Please fix.")
          []
      end
    rescue
      e ->
        Logger.error("dir not implemented at #{inspect f}. Please fix.\n#{inspect e}\n#{ Exception.format_stacktrace System.stacktrace }")
        []
    end
  end

  @doc ~S"""
  Adds a method to be called later.

  Method function must returns:

  * {:ok, v} -- Ok value
  * {:error, v} -- Error to return to client
  * v -- Ok value

  Options may be:

  * `async`, default true. Execute in another task, returns a promise.
  * `context`, the called function will be called with the client context. It is a Serverboards.MOM.RPC.Context

  ## Example

    iex> alias Serverboards.MOM.RPC.MethodCaller
    iex> {:ok, mc} = MethodCaller.start_link
    iex> MethodCaller.add_method mc, "test_ok", fn _ -> {:ok, :response_ok} end
    iex> MethodCaller.add_method mc, "test_error", fn _ -> {:error, :response_error} end
    iex> MethodCaller.add_method mc, "test_plain", fn _ -> :response_plain_ok end
    iex> MethodCaller.call mc, "test_ok", [], nil
    {:ok, :response_ok}
    iex> MethodCaller.call mc, "test_error", [], nil
    {:error, :response_error}
    iex> MethodCaller.call mc, "test_plain", [], nil
    {:ok, :response_plain_ok}

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

  Method callers are optimized callers, but a single function can be passed and
  it will be called with an %RPC.Message. If it returns {:ok, res} or
  {:error, error} its processed, :empty or :nok tries next callers.

  ## Example:

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
    {:ok, :c}
    iex> MethodCaller.call a, "c_", [], context
    {:ok, {:c, :me}}
    iex> MethodCaller.call b, "c", [], context
    {:ok, :c}
    iex> MethodCaller.call b, "c_", [], context
    {:ok, {:c, :me}}
    iex> MethodCaller.add_method a, "c", fn _ -> :shadow end
    iex> MethodCaller.call a, "c", [], context
    {:ok, :shadow}
    iex> MethodCaller.call b, "c", [], context
    {:ok, :c}

  Custom method caller that calls a function

    iex> alias Serverboards.MOM.RPC.MethodCaller
    iex> {:ok, mc} = MethodCaller.start_link
    iex> MethodCaller.add_method_caller(mc, fn msg ->
    ...>   case msg.method do
    ...>     "hello."<>ret -> {:ok, ret}
    ...>     _ -> :nok
    ...>   end
    ...> end)
    iex> MethodCaller.call mc, "hello.world", [], nil
    {:ok, "world"}
    iex> MethodCaller.call mc, "world.hello", [], nil
    {:error, :unknown_method}

  """
  def add_method_caller(pid, pid) do
    raise Exception, "Cant add a method caller to itself."
  end
  def add_method_caller(pid, nmc) when is_pid(pid) do
    Logger.debug("Add caller #{inspect nmc} to #{inspect pid}")
    Agent.update pid, fn st ->
      %{ st | mc: st.mc ++ [nmc] }
    end
    :ok
  end

  @doc ~S"""
  Calls a method by name.

  Waits for execution always. Independent of async.

  Returns one of:

  * {:ok, v}
  * {:error, e}

  """
  def call(pid, method, params, context) do
    __call(pid, %RPC.Message{ method: method, params: params, context: context})
  end

  # same as call, but uses a RPC.Message
  defp __call(pid, %Serverboards.MOM.RPC.Message{} = msg) do
    st = Agent.get pid, &(&1)
    case Map.get st.methods, msg.method do
      {f, options} ->
        Logger.debug("Fast call #{msg.method} #{inspect pid}")
        v = if Keyword.get(options, :context, false) do
          f.(msg.params, msg.context)
        else
          f.(msg.params)
        end
        case v do
          {:ok, v} -> {:ok, v}
          {:error, e} -> {:error, e}
          v -> {:ok, v}
        end
      nil ->
        Enum.reduce_while st.mc, nil, fn mc, _acc ->
          ret = case mc do
            mc when is_pid(mc) ->
              Logger.debug("Slow call PID #{msg.method} #{inspect mc}")
              __call(mc, msg)
            f when is_function(f) ->
              Logger.debug("Slow call f #{msg.method} #{inspect mc}")
              f.(msg)
          end
          Logger.debug("Result #{inspect ret}")
          no_method={:error, :unknown_method}
          case ret do
            {:ok, ret} -> {:halt, {:ok, ret}}
            {:error, :unknown_method} -> {:cont, no_method}
            :nok -> {:cont, no_method}
            :empty -> {:cont, no_method}

            {:error, other} -> {:halt, {:error, other}}
          end
        end
    end
  end

  @doc ~S"""
  Calls the method and calls the callback continuation with the result.

  If the method was async, it will be run in another task, if it was sync,
  its run right now.

  If the method does not exists, returns :nok, if it does, returns :ok.

  Callback is a function that can receive {:ok, value} or {:error, %Exception{...}}

  Alternatively mc can be a function that receies a %RPC.Message and returns any of:

  * {:ok, ret}
  * {:error, error}
  * :nok
  * :empty

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
    {:ok, "test_ok"}

    iex> alias Serverboards.MOM.RPC.{Context, MethodCaller}
    iex> MethodCaller.cast(fn msg -> {:ok, :ok} end, "any", [], nil, fn
    ...>   {:ok, _v} -> :ok
    ...>   {:error, e} -> {:error, e}
    ...> end)
    :ok

  """
  def cast(f, method, params, context, cb) when is_function(f)  do
    ret = try do
      f.(%RPC.Message{ method: method, params: params, context: context})
    rescue
      other ->
        Logger.error("#{Exception.format :error, other}")
        {:error, other}
    end
    Logger.debug("Method #{method} caller function #{inspect f} -> #{inspect ret}.")

    cb_params = case ret do
      {:ok, ret} -> {:ok, ret}
      {:error, :unknown_method} -> {:error, :unknown_method}
      {:error, other} -> {:error, other}
      :nok -> {:error, :unknown_method}
      :empty -> {:error, :unknown_method}
    end

    cb.(cb_params)
  end

  def cast(pid, method, params, context, cb) when is_pid(pid) do
    Logger.debug("Method #{method} caller pid #{inspect pid}")
    st = Agent.get pid, &(&1)
    case Map.get st.methods, method do
      {f, options} ->
        # Calls the function and the callback with the result, used in async and sync.
        call_f = fn ->
          try do
            v = if Keyword.get(options, :context, false) do
              Logger.debug("Calling with context #{inspect f} #{inspect options}")
              f.(params, context)
            else
              Logger.debug("Calling without context #{inspect f}")
              f.(params)
            end
            Logger.debug("Method #{method} caller function #{inspect f} -> #{inspect v}.")
            case v do
              {:error, e} ->
                cb.({:error, e })
              {:ok, v} ->
                cb.({:ok, v })
              v ->
                cb.({:ok, v })
            end
          rescue
            Serverboards.MOM.RPC.UnknownMethod ->
              Logger.error("Unknown method #{method}\n#{Exception.format_stacktrace System.stacktrace}")
              cb.({:error, :unknown_method})
            CaseClauseError ->
              Logger.error("Case clause error method #{method}\n#{Exception.format_stacktrace System.stacktrace}")
              cb.({:error, :bad_arity})
            BadArityError ->
              Logger.error("Bad arity error #{method}\n#{Exception.format_stacktrace System.stacktrace}")
              cb.({:error, :bad_arity})
            e ->
              Logger.error("Error on method #{method}\n#{inspect e}\n#{Exception.format_stacktrace System.stacktrace}")
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
        Logger.debug("Call cast from #{inspect pid} to #{inspect st.mc}")
        cast_mc(st.mc, method, params, context, cb)
    end
  end

  defp cast_mc([], _, _, _, cb) do # end of search, :unknown_method
    Logger.debug("No more Method Callers to call")
    cb.({:error, :unknown_method})
    :nok
  end

  defp cast_mc([h | t], method, params, context, cb) do
    Logger.debug("Cast mc #{inspect h}")
    cast(h, method, params, context, fn
      # Keep searching for it
      {:error, :unknown_method} ->
        #Logger.debug("Keep looking MC")
        cast_mc(t, method, params, context, cb)
      # done, callback with whatever.
      other ->
        Logger.debug("Done #{inspect other}")
        cb.(other)
    end)
  end

end
