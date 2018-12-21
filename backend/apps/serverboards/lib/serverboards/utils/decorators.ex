require Logger

defmodule Serverboards.Utils.Decorators do
  @moduledoc ~S"""
  Augmented RPC.MethodCaller that ensures permissions before returning values.

  API users may use permissions as guards for the methods. This ensures both
  calling and `dir` has the proper permissions from context.user.
  """

  alias MOM.RPC

  @doc ~S"""
  Decorates a method caller so that it can require_perms

  This is a serverboards specific feature, as it depends on the context as
  provided by serverboards, but uses the RPC.MethodCaller.add_guard.

  ## Example

    iex> alias MOM.RPC
    iex> {:ok, mc} = RPC.MethodCaller.start_link
    iex> permission_method_caller mc
    iex> RPC.MethodCaller.add_method mc, "echo", fn params -> params end, required_perm: "echo"
    iex> {:ok, context} = RPC.Client.start_link(writef: {RPC.Client, :set, []})
    iex> RPC.Client.set context, :user, %{ email: "test@email.com", perms: []}
    iex> RPC.MethodCaller.call mc, "echo", "test", context
    {:error, :unknown_method}
    iex> RPC.Client.set context, :user, %{ email: "test@email.com", perms: ["echo"]}
    iex> RPC.MethodCaller.call mc, "echo", "test", context
    {:ok, "test"}
    iex> RPC.Client.set context, :user, %{ email: "test@email.com", perms: []}
    iex> RPC.MethodCaller.call mc, "echo", "test", context
    {:error, :unknown_method}

  """
  def permission_method_caller(mc) do
    RPC.MethodCaller.add_guard(mc, {__MODULE__, :perms_guard, []})
    mc
  end

  def perms_guard(context, options) do
    # Logger.debug("Check guard #{inspect({context, options})}")

    case Keyword.get(options, :required_perm, nil) do
      nil ->
        true

      required_perm ->
        user = RPC.Client.get(context, :user, %{})
        perms = Map.get(user, :perms, [])
        # Logger.debug("Has #{inspect(perms)}, requires #{inspect(required_perm)}")
        Enum.member?(perms, required_perm)
    end
  end
end
