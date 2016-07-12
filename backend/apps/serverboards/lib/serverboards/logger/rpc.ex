require Logger

defmodule Serverboards.Logger.RPC do
  alias MOM.RPC
  alias Serverboards.Logger

  def start_link options \\ [] do
    {:ok, mc} = RPC.MethodCaller.start_link options
    Serverboards.Utils.Decorators.permission_method_caller mc

    import RPC.MethodCaller

    add_method mc, "logs.history", fn opts ->
      opts = Map.new(Enum.map(Map.to_list(opts), fn
        {"start", v} -> {:start, v}
        {"count", v} -> {:count, v}
      end))
      Logger.history(opts)
    end, [required_perm: "logs.view"]

    MOM.Channel.subscribe(:auth_authenticated, fn %{ payload: %{ client: client, user: user}} ->
      MOM.RPC.Client.add_method_caller client, mc
    end)

    {:ok, mc}
  end
end
