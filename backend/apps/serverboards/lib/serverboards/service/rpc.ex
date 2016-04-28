require Logger

defmodule Serverboards.Service.RPC do
  alias Serverboards.MOM.RPC
  alias Serverboards.MOM.RPC.Context
  alias Serverboards.MOM

  def start_link(options \\ []) do
    {:ok, mc} = RPC.MethodCaller.start_link options
    import Serverboards.Service.Service

    # Adds that it needs permissions.
    Serverboards.Utils.Decorators.permission_method_caller mc


    # Services
    RPC.MethodCaller.add_method mc, "service.add", fn [servicename, options], context ->
      #Logger.debug("#{inspect Context.debug(context)}")
      service_add servicename, options, Context.get(context, :user)
    end, [requires_perm: "service.add", context: true]

    RPC.MethodCaller.add_method mc, "service.update", fn
      [service_id, operations], context ->
        {:ok, service} = service_update service_id, operations, Context.get(context, :user)
        {:ok, Serverboards.Utils.clean_struct service}
    end, [requires_perm: "service.add", context: true]

    RPC.MethodCaller.add_method mc, "service.delete", fn [service_id], context ->
      service_delete service_id, Context.get(context, :user)
    end, [requires_perm: "service.add", context: true]

    RPC.MethodCaller.add_method mc, "service.info", fn [service_id], context ->
      {:ok, service} = service_info service_id, Context.get(context, :user)
      {:ok, Serverboards.Utils.clean_struct service}
    end, [requires_perm: "service.add", context: true]

    RPC.MethodCaller.add_method mc, "service.list", fn [], context ->
      Logger.info("Service List!!!")
      {:ok, services} = service_list Context.get(context, :user)
      Enum.map services, &Serverboards.Utils.clean_struct(&1)
    end, [requires_perm: "service.list", context: true]

    # All authenticated users may use this method caller, but it ensures permissions before any call.
    MOM.Channel.subscribe(:auth_authenticated, fn %{ payload: %{ client: client, user: user}} ->
      RPC.add_method_caller (RPC.Client.get client, :to_serverboards), mc
      :ok
    end)

    {:ok, mc}
  end
end
