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
  Calls the method and calls the callback with the result.

  If the method was async, it will be run in another task, if it was sync,
  its run right now.

  If the method does not exists, returns :nok, if it does, returns :ok.

  Callback is a function that can receive {:ok, value} or {:error, %Exception{...}}
  """
  def cast(pid, method, params, cb) do
    case Agent.get(pid, &Map.get(&1, method)) do
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
              cb.({:error, :unknown_method})
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
        # not found
        :nok
    end
  end
end
