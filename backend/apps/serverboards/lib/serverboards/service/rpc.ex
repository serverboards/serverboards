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

    RPC.MethodCaller.add_method mc, "service.create", fn attributes, context ->
      service_add attributes, Context.get(context, :user)
    end, [required_perm: "service.create", context: true]

    RPC.MethodCaller.add_method mc, "service.delete", fn [uuid], context ->
      service_delete uuid, Context.get(context, :user)
    end, [required_perm: "service.create", context: true]

    RPC.MethodCaller.add_method mc, "service.update", fn [service, operations], context ->
      service_update service, operations, Context.get(context, :user)
    end, [required_perm: "service.update", context: true]

    RPC.MethodCaller.add_method mc, "service.get", fn [service], context ->
      service_get service, Context.get(context, :user)
    end, [required_perm: "service.get", context: true]

    RPC.MethodCaller.add_method mc, "service.list", fn filter ->
      # some cleanup
      filter = Enum.map(filter, fn
        [k,v] -> {k,v}
        {k,v} -> {k,v}
      end)
      filter = Serverboards.Utils.keys_to_atoms_from_list(filter, ~w"name type project traits")
      filter = if Keyword.has_key?(filter, :traits) do
        traits = case filter[:traits] do
          b when is_binary(b) -> String.split(b)
          l when is_list(l) -> l
        end
        Keyword.put(filter, :traits, traits)
      else
        filter
      end

      services = service_list filter
      Enum.map services, &Serverboards.Utils.clean_struct(&1)
    end, [required_perm: "service.get"]

    RPC.MethodCaller.add_method mc, "service.catalog", fn filter ->
      service_catalog filter
    end, [required_perm: "service.get"]

    RPC.MethodCaller.add_method mc, "service.attach", fn [project, service], context ->
      service_attach project, service, Context.get(context, :user)
    end, [required_perm: "service.attach", context: true]

    RPC.MethodCaller.add_method mc, "service.detach", fn [project, service], context ->
      service_detach project, service, Context.get(context, :user)
    end, [required_perm: "service.attach", context: true]

    RPC.MethodCaller.add_method mc, "service.screens", fn traits ->
      service_screens traits
    end, [required_perm: "service.get"]

    # Add this method caller once authenticated.
    MOM.Channel.subscribe(:auth_authenticated, fn %{ payload: %{ client: client }} ->
      MOM.RPC.Client.add_method_caller client, mc
      :ok
    end)

    {:ok, mc}
  end
end
