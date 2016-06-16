require Serverboards.Logger
alias Serverboards.Logger


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

    RPC.MethodCaller.add_method mc, "settings.get", fn [section], context ->
      perms = (RPC.Context.get context, :user).perms
      can_view = (
        ("settings.view" in perms) or
        ("settings.view[#{section}]" in perms)
        )
      if can_view do
        Serverboards.Settings.get section
      else
        {:error, :not_allowed}
      end
    end, [context: true]

    # Add this method caller once authenticated.
    MOM.Channel.subscribe(:auth_authenticated, fn %{ payload: %{ client: client }} ->
      Logger.debug("New client, has perms: #{inspect (RPC.Client.get client, :user)}")
      RPC.Client.add_method_caller client, mc
      :ok
    end)

    {:ok, mc}
  end
end
