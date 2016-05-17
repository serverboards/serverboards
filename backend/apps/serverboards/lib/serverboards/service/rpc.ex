require Logger

defmodule Serverboards.Service.RPC do
  alias Serverboards.MOM.RPC
  alias Serverboards.MOM.RPC.Context
  alias Serverboards.MOM

  def start_link(options \\ []) do
    {:ok, mc} = RPC.MethodCaller.start_link options
    import Serverboards.Service.Component

    # Adds that it needs permissions.
    Serverboards.Utils.Decorators.permission_method_caller mc


    ## Components

    RPC.MethodCaller.add_method mc, "component.add", fn attributes, context ->
      component_add attributes, Context.get(context, :user)
    end, [requires_perm: "component.add", context: true]

    RPC.MethodCaller.add_method mc, "component.delete", fn [uuid], context ->
      component_delete uuid, Context.get(context, :user)
    end, [requires_perm: "component.add", context: true]

    RPC.MethodCaller.add_method mc, "component.update", fn [component, operations], context ->
      component_update component, operations, Context.get(context, :user)
    end, [requires_perm: "component.update", context: true]

    RPC.MethodCaller.add_method mc, "component.info", fn [component], context ->
      component_info component, Context.get(context, :user)
    end, [requires_perm: "component.info", context: true]

    RPC.MethodCaller.add_method mc, "component.list", fn filter, context ->
      components = component_list filter, Context.get(context, :user)
      Enum.map components, &Serverboards.Utils.clean_struct(&1)
    end, [requires_perm: "component.info", context: true]

    RPC.MethodCaller.add_method mc, "component.available", fn filter, context ->
      component_list_available filter, Context.get(context, :user)
    end, [requires_perm: "component.info", context: true]

    RPC.MethodCaller.add_method mc, "component.attach", fn [serverboard, component], context ->
      component_attach serverboard, component, Context.get(context, :user)
    end, [requires_perm: "component.attach", context: true]

    RPC.MethodCaller.add_method mc, "component.detach", fn [serverboard, component], context ->
      component_detach serverboard, component, Context.get(context, :user)
    end, [requires_perm: "component.attach", context: true]

    # Add this method caller once authenticated.
    MOM.Channel.subscribe(:auth_authenticated, fn %{ payload: %{ client: client, user: user}} ->
      RPC.add_method_caller (RPC.Client.get client, :to_serverboards), mc
      :ok
    end)

    {:ok, mc}
  end
end
