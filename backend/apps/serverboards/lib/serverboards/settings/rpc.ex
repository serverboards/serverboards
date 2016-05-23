require Logger

defmodule Serverboards.Settings.RPC do
  alias MOM.RPC
  alias MOM.RPC.Context
  alias MOM

  def start_link(options \\ []) do
    {:ok, mc} = RPC.MethodCaller.start_link options
    import Serverboards.Settings

    # Adds that it needs permissions.
    Serverboards.Utils.Decorators.permission_method_caller mc

    RPC.MethodCaller.add_method mc, "settings.all", fn [], context ->
      all_settings Context.get(context, :user)
    end, [required_perm: "settings.view", context: true]

    RPC.MethodCaller.add_method mc, "settings.update", fn [section, changes], context ->
      update section, changes, Context.get(context, :user)
    end, [required_perm: "settings.update", context: true]

    # Add this method caller once authenticated.
    MOM.Channel.subscribe(:auth_authenticated, fn %{ payload: %{ client: client, user: user}} ->
      RPC.add_method_caller (RPC.Client.get client, :to_serverboards), mc
      :ok
    end)

    {:ok, mc}
  end
end
