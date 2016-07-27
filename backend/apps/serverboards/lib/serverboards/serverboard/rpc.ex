require Logger

defmodule Serverboards.Serverboard.RPC do
  alias MOM.RPC
  alias MOM.RPC.Context
  alias MOM
  import Serverboards.Serverboard

  def start_link(options \\ []) do
    {:ok, mc} = RPC.MethodCaller.start_link options

    # Adds that it needs permissions.
    Serverboards.Utils.Decorators.permission_method_caller mc

    # Serverboards
    RPC.MethodCaller.add_method mc, "serverboard.add", fn [serverboardname, options], context ->
      serverboard_add serverboardname, options, Context.get(context, :user)
    end, [required_perm: "serverboard.add", context: true]

    RPC.MethodCaller.add_method mc, "serverboard.delete", fn [serverboard_id], context ->
      serverboard_delete serverboard_id, Context.get(context, :user)
    end, [required_perm: "serverboard.add", context: true]

    RPC.MethodCaller.add_method mc, "serverboard.update", fn
      [serverboard_id, operations], context ->
        serverboard_update serverboard_id, operations, Context.get(context, :user)
      end, [required_perm: "serverboard.update", context: true]

    RPC.MethodCaller.add_method mc, "serverboard.info", fn [serverboard_id], context ->
      {:ok, serverboard} = serverboard_info serverboard_id, Context.get(context, :user)
      {:ok, Serverboards.Utils.clean_struct serverboard}
    end, [required_perm: "serverboard.info", context: true]

    RPC.MethodCaller.add_method mc, "serverboard.list", fn [], context ->
      {:ok, serverboards} = serverboard_list Context.get(context, :user)
      Enum.map serverboards, &Serverboards.Utils.clean_struct(&1)
    end, [required_perm: "serverboard.info", context: true]


    RPC.MethodCaller.add_method mc, "serverboard.widget.add", fn attr, context ->
      me = Context.get(context, :user)
      Serverboards.Serverboard.Widget.widget_add(attr["serverboard"], %{
        config: attr["config"],
        ui: attr["ui"],
        widget: attr["widget"]
        }, me)
    end, [required_perm: "serverboard.widget.add", context: true]

    RPC.MethodCaller.add_method mc, "serverboard.widget.remove", fn [uuid], context ->
      me = Context.get(context, :user)
      Serverboards.Serverboard.Widget.widget_remove(uuid, me)
    end, [required_perm: "serverboard.widget.add", context: true]

    RPC.MethodCaller.add_method mc, "serverboard.widget.update", fn attr, context ->
      me = Context.get(context, :user)
      Serverboards.Serverboard.Widget.widget_update(attr["uuid"], %{
        config: attr["config"],
        ui: attr["ui"],
        widget: attr["widget"]
        }, me)
    end, [required_perm: "serverboard.widget.update", context: true]

    RPC.MethodCaller.add_method mc, "serverboard.widget.list", fn [shortname] ->
      Serverboards.Serverboard.Widget.widget_list(shortname)
    end, [required_perm: "serverboard.info"]

    RPC.MethodCaller.add_method mc, "serverboard.widget.catalog", fn [serverboard] ->
        Serverboards.Serverboard.Widget.catalog(serverboard)
    end, [required_perm: "serverboard.info"]

    # Add this method caller once authenticated.
    MOM.Channel.subscribe(:auth_authenticated, fn %{ payload: %{ client: client }} ->
      MOM.RPC.Client.add_method_caller client, mc
      :ok
    end)

    {:ok, mc}
  end
end
