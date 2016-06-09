require Logger

defmodule Serverboards.Event.RPC do
  def start_link(options) do
    import MOM.RPC.MethodCaller
    {:ok, mc} = MOM.RPC.MethodCaller.start_link(options)

    # Adds that it needs permissions and user
    Serverboards.Utils.Decorators.permission_method_caller mc


    add_method mc, "event.subscribe", fn events, context ->
      subscriptions = MOM.RPC.Context.get context, :subscriptions, []
      MOM.RPC.Context.set context, :subscriptions, Enum.uniq(subscriptions ++ events)
      :ok
    end, context: true
    add_method mc, "event.unsubscribe", fn events, context ->
      subscriptions = MOM.RPC.Context.get context, :subscriptions, []
      subscriptions = Enum.filter(subscriptions, &(not &1 in events))
      MOM.RPC.Context.set context, :subscriptions, subscriptions
      :ok
    end, context: true
    add_method mc, "event.subscriptions", fn [], context ->
      MOM.RPC.Context.get context, :subscriptions, []
    end, context: true

    add_method mc, "event.emit", fn
      [event_name, data, guards] ->
        Event.emit(event_name, data, guards)
      [event_name, data] ->
        Event.emit(event_name, data)
    end, required_perm: "event.emit"

    MOM.Channel.subscribe(:auth_authenticated, fn %{ payload: %{ client: client }} ->
      Logger.info("Event RPC ready.")
      MOM.RPC.Client.add_method_caller client, mc
    end)


    {:ok, mc}
  end
end
