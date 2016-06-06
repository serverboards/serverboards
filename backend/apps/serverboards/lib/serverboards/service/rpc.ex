require Logger

defmodule Serverboards.Service.RPC do
  alias MOM.RPC
  alias MOM.RPC.Context
  alias MOM

  def start_link(options \\ []) do
    {:ok, mc} = RPC.MethodCaller.start_link options
    import Serverboards.Service

    # Adds that it needs permissions.
    Serverboards.Utils.Decorators.permission_method_caller mc


    ## Services

    RPC.MethodCaller.add_method mc, "service.add", fn attributes, context ->
      service_add attributes, Context.get(context, :user)
    end, [required_perm: "service.add", context: true]

    RPC.MethodCaller.add_method mc, "service.delete", fn [uuid], context ->
      service_delete uuid, Context.get(context, :user)
    end, [required_perm: "service.add", context: true]

    RPC.MethodCaller.add_method mc, "service.update", fn [service, operations], context ->
      service_update service, operations, Context.get(context, :user)
    end, [required_perm: "service.update", context: true]

    RPC.MethodCaller.add_method mc, "service.info", fn [service], context ->
      service_info service, Context.get(context, :user)
    end, [required_perm: "service.info", context: true]

    RPC.MethodCaller.add_method mc, "service.list", fn filter, context ->
      services = service_list filter, Context.get(context, :user)
      Enum.map services, &Serverboards.Utils.clean_struct(&1)
    end, [required_perm: "service.info", context: true]

    RPC.MethodCaller.add_method mc, "service.available", fn filter, context ->
      service_list_available filter, Context.get(context, :user)
    end, [required_perm: "service.info", context: true]

    RPC.MethodCaller.add_method mc, "service.attach", fn [serverboard, service], context ->
      service_attach serverboard, service, Context.get(context, :user)
    end, [required_perm: "service.attach", context: true]

    RPC.MethodCaller.add_method mc, "service.detach", fn [serverboard, service], context ->
      service_detach serverboard, service, Context.get(context, :user)
    end, [required_perm: "service.attach", context: true]

    # Add this method caller once authenticated.
    MOM.Channel.subscribe(:auth_authenticated, fn %{ payload: %{ client: client, user: user}} ->
      MOM.RPC.Client.add_method_caller client, mc
      :ok
    end)

    {:ok, mc}
  end
end
