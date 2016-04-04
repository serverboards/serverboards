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
    {:ok, pid} = Agent.start_link fn -> %{} end

    add_method pid, "dir", fn _ ->
      (Agent.get pid, &(&1))
        |> Enum.map(fn {name, _} ->
          name
        end)
    end, async: false

    {:ok, pid}
  end


  @doc ~S"""
  Adds a method to be called later.

  Options may be:

  * `async`, default true. Execute in another task, returns a promise.
  """
  def add_method(pid, name, f, options \\ []) do
    Agent.update pid, &Map.put(&1, name, {f, options})
    :ok
  end

  @doc ~S"""
  Calls a method by name.

  Waits for execution always. Independent of async. Returns the value of
  executing the method,
  """
  def call(pid, method, params) do
    case Agent.get pid, &Map.get(&1, method) do
      {f, _} ->
        f.(params)
      _ ->
        raise RPC.UnknownMethod, method: method
    end
  end

  @doc ~S"""
  Calls the mehtod inside and returns a promise of its execution.

  If the method was async, it will be run in another task, if it was sync,
  its run right now.

  If the method does not exists, returns :nok
  """
  def cast(pid, method, params) do
    promise = Promise.new
    case Agent.get pid, &Map.get(&1, method) do
      {f, options} ->
        if Keyword.get(options, :async, true) do
          nf = fn params ->
            Task.async fn ->
              try do
                v=f.(params)
                Promise.set( promise,  v )
              rescue
                e ->
                  Promise.set_error( promise, e )
              end
            end
            promise
          end
          nf.(params)
        else
          v=f.(params)
          Promise.set promise, v
        end
        promise
      _ ->
        :nok
    end
  end
end
