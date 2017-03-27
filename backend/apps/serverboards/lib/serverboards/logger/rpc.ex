require Logger

defmodule Serverboards.Logger.RPC do
  alias MOM.RPC

  def start_link options \\ [] do
    {:ok, mc} = RPC.MethodCaller.start_link options
    Serverboards.Utils.Decorators.permission_method_caller mc

    import RPC.MethodCaller

    add_method mc, "logs.list", fn opts ->
      opts = Map.new(Enum.map(Map.to_list(opts), fn
        {"start", v} -> {:start, v}
        {"count", v} -> {:count, v}
      end))
      {:ok, history} = Serverboards.Logger.history(opts)

      history = %{
        count: history.count,
        lines: Enum.map(history.lines, fn l -> %{
            l |
            timestamp: Ecto.DateTime.to_iso8601(l.timestamp)
          } end)
      }

      {:ok, history}
    end, [required_perm: "logs.view"]

    add_method mc, "log.debug", fn
      [message] ->
        Logger.debug(message)
      [message, extra] ->
        extra = decorate_extra(extra)
        Logger.debug(message, extra)
    end
    add_method mc, "log.error", fn
      [message] ->
        Logger.error(message)
      [message, extra] ->
        extra = decorate_extra(extra)
        Logger.error(message, extra)
    end
    add_method mc, "log.warning", fn
      [message] ->
        Logger.warn(message)
      [message, extra] ->
        extra = decorate_extra(extra)
        Logger.warn(message, extra)
    end
    add_method mc, "log.info", fn
      [message] ->
        Logger.info(message)
      [message, extra] ->
        extra = decorate_extra(extra)
        Logger.info(message, extra)
    end

    MOM.Channel.subscribe(:auth_authenticated, fn msg ->
      MOM.RPC.Client.add_method_caller msg.payload.client, mc
    end)

    {:ok, mc}
  end

  def decorate_extra(extra) do
    Map.to_list(extra)
      |> Enum.map(fn {k, v} -> {String.to_atom(k), v} end)
  end
end
