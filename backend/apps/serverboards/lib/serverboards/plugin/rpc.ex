require Logger

defmodule Serverboards.Plugin.RPC do
  alias MOM.RPC
  alias Serverboards.Plugin

  @component_id_re ~r/(\w*|\.)+\/(\w*|\.)+/

  def has_perm_for_plugin(context, plugin) do
    perms = RPC.Context.get(context, :user).perms

    # Logger.debug("Check has perm for plugin #{inspect perms} #{inspect plugin} #{inspect Regex.match?(@component_id_re, plugin)}")
    cond do
      plugin == :any ->
        Enum.any?(perms, &(String.starts_with?(&1, "plugin[") or &1 == "plugin"))

      "plugin" in perms ->
        true

      "plugin[#{plugin}]" in perms ->
        true

      Regex.match?(@component_id_re, plugin) ->
        component = Serverboards.Plugin.Registry.find(plugin)

        # Logger.debug("Check permissions at #{inspect perms} #{inspect component.extra["user_perms"], pretty: true}")
        case component.extra["user_perms"] do
          nil ->
            false

          user_perms when is_list(user_perms) ->
            Enum.all?(user_perms, fn user_perm -> Enum.any?(perms, &(&1 == user_perm)) end)

          user_perm ->
            Enum.any?(perms, &(&1 == user_perm))
        end

      true ->
        # get the plugin definition (if id is a plugin) and the user_perms to be checked too
        false
    end
  end

  def check_perm_for_plugin_data(context) do
    user = RPC.Context.get(context, :user)
    context_plugin = RPC.Context.get(context, :plugin)
    # Logger.debug("Plugin dataA #{inspect context_plugin}")
    case context_plugin do
      # not called from plugin, error
      nil ->
        false

      # called from plugin, allow only to myself
      %{plugin_id: plugin} ->
        {plugin, user}
    end
  end

  def check_perm_for_plugin_data(context, plugin) do
    user = RPC.Context.get(context, :user)
    context_plugin = RPC.Context.get(context, :plugin)
    # Logger.debug("Plugin dataB #{inspect context_plugin}")
    case context_plugin do
      # not called from plugin, check permissions
      nil ->
        perms = user.perms

        cond do
          "plugin.data" in perms -> {plugin, user}
          "plugin.data[#{plugin}]" in perms -> {plugin, user}
          true -> false
        end

      # called from plugin, allow only to myself
      %{plugin_id: ^plugin} ->
        {plugin, user}

      # error on others
      %{plugin_id: plugin_id} ->
        Logger.error(
          "Plugin #{inspect(plugin_id)} does not have access to plugin data from #{
            inspect(plugin)
          }"
        )

        false
    end
  end

  def start_link do
    {:ok, method_caller} = RPC.MethodCaller.start_link(name: Serverboards.Plugin.RPC)
    Serverboards.Utils.Decorators.permission_method_caller(method_caller)

    RPC.MethodCaller.add_method(
      method_caller,
      "plugin.start",
      fn [plugin_component_id], context ->
        if has_perm_for_plugin(context, plugin_component_id) do
          user = RPC.Context.get(context, :user)
          Plugin.Runner.start(plugin_component_id, user.email)
        else
          {:error, :unknown_method}
        end
      end,
      context: true
    )

    RPC.MethodCaller.add_method(
      method_caller,
      "plugin.stop",
      fn [uuid], context ->
        if has_perm_for_plugin(context, :any) do
          Plugin.Runner.stop(uuid)
        else
          {:error, :unknown_method}
        end
      end,
      context: true
    )

    RPC.MethodCaller.add_method(
      method_caller,
      "plugin.kill",
      fn [uuid_or_id], context ->
        if has_perm_for_plugin(context, :any) do
          user = RPC.Context.get(context, :user)

          uuid =
            case UUID.info(uuid_or_id) do
              {:ok, _info} ->
                uuid_or_id

              _ ->
                case Plugin.Runner.get_by_component_id(uuid_or_id) do
                  {:ok, uuid} -> uuid
                  _ -> nil
                end
            end

          if uuid do
            Logger.warn("Plugin #{inspect(uuid_or_id)} killed by #{inspect(user.email)}",
              plugin_uuid: uuid,
              user: user.email
            )

            Plugin.Runner.kill(uuid)
          else
            {:error, :not_running}
          end
        else
          {:error, :unknown_method}
        end
      end,
      context: true
    )

    RPC.MethodCaller.add_method(
      method_caller,
      "plugin.call",
      fn
        [id, method, params], context ->
          call_plugin(context, id, method, params)

        [id, method], context ->
          call_plugin(context, id, method, [])
      end,
      context: true
    )

    RPC.MethodCaller.add_method(
      method_caller,
      "plugin.is_running",
      fn
        [id], context ->
          if has_perm_for_plugin(context, :any) do
            Plugin.Runner.status(id) == :running
          else
            {:error, :unknown_method}
          end
      end,
      required_perm: "plugin",
      context: true
    )

    RPC.MethodCaller.add_method(
      method_caller,
      "plugin.ps",
      fn
        [] -> Plugin.Runner.ps()
      end,
      required_perm: "plugin"
    )

    RPC.MethodCaller.add_method(
      method_caller,
      "plugin.catalog",
      fn
        [] ->
          Serverboards.Plugin.Registry.list()

        %{} ->
          Serverboards.Plugin.Registry.list()
      end,
      required_perm: "plugin"
    )

    RPC.MethodCaller.add_method(
      method_caller,
      "plugin.reload",
      fn
        _ ->
          Serverboards.Plugin.Registry.reload_plugins()
      end,
      required_perm: "plugin.install"
    )

    RPC.MethodCaller.add_method(
      method_caller,
      "plugin.data.update",
      fn
        [key, value], context ->
          case check_perm_for_plugin_data(context) do
            {plugin, user} ->
              Plugin.Data.data_set(plugin, key, value, user)

            _ ->
              {:error, :not_allowed}
          end

        [plugin, key, value], context ->
          case check_perm_for_plugin_data(context, plugin) do
            {plugin, user} ->
              Plugin.Data.data_set(plugin, key, value, user)

            _ ->
              {:error, :not_allowed}
          end
      end,
      context: true
    )

    RPC.MethodCaller.add_method(
      method_caller,
      "plugin.data.get",
      fn
        [key], context ->
          case check_perm_for_plugin_data(context) do
            {plugin, _user} ->
              {:ok, Plugin.Data.data_get(plugin, key)}

            _ ->
              {:error, :not_allowed}
          end

        [plugin, key], context ->
          case check_perm_for_plugin_data(context, plugin) do
            {plugin, _user} ->
              {:ok, Plugin.Data.data_get(plugin, key)}

            _ ->
              {:error, :not_allowed}
          end
      end,
      context: true
    )

    RPC.MethodCaller.add_method(
      method_caller,
      "plugin.data.list",
      fn
        [plugin, keyprefix], context ->
          case check_perm_for_plugin_data(context, plugin) do
            {plugin, _user} ->
              {:ok, Plugin.Data.data_keys(plugin, keyprefix)}

            _ ->
              {:error, :not_allowed}
          end

        [keyprefix], context ->
          case check_perm_for_plugin_data(context) do
            {plugin, _user} ->
              {:ok, Plugin.Data.data_keys(plugin, keyprefix)}

            _ ->
              {:error, :not_allowed}
          end
      end,
      context: true
    )

    RPC.MethodCaller.add_method(
      method_caller,
      "plugin.data.items",
      fn
        [plugin, keyprefix], context ->
          case check_perm_for_plugin_data(context, plugin) do
            {plugin, _user} ->
              {:ok, Plugin.Data.data_items(plugin, keyprefix)}

            _ ->
              {:error, :not_allowed}
          end

        [keyprefix], context ->
          case check_perm_for_plugin_data(context) do
            {plugin, _user} ->
              {:ok, Plugin.Data.data_items(plugin, keyprefix)}

            _ ->
              {:error, :not_allowed}
          end
      end,
      context: true
    )

    RPC.MethodCaller.add_method(
      method_caller,
      "plugin.data.delete",
      fn [plugin, key], context ->
        user = RPC.Context.get(context, :user)
        perms = user.perms
        can_data = "plugin.data" in perms or "plugin.data[#{plugin}]" in perms

        if can_data do
          {:ok, Plugin.Data.data_remove(plugin, key, user)}
        else
          Logger.debug("Perms #{inspect(perms)}, not plugin.data, nor plugin.data[#{plugin}]")
          {:error, :not_allowed}
        end
      end,
      context: true
    )

    RPC.MethodCaller.add_method(method_caller, "plugin.component.catalog", fn
      [] ->
        []
        |> Serverboards.Plugin.Registry.filter_component()
        |> Serverboards.Utils.clean_struct()

      [filter] ->
        Serverboards.Utils.keys_to_atoms_from_list(filter, ~w"type id trait traits")
        |> Serverboards.Plugin.Registry.filter_component()
        |> Serverboards.Utils.clean_struct()

      %{} = filter ->
        Serverboards.Utils.keys_to_atoms_from_list(filter, ~w"type id trait traits")
        |> Serverboards.Plugin.Registry.filter_component()
        |> Serverboards.Utils.clean_struct()
    end)

    {:ok, method_caller}
  end

  def call_plugin(context, id, method, params) do
    if has_perm_for_plugin(context, id) do
      Plugin.Runner.call(id, method, params)
    else
      {:error, :unknown_method}
    end
  end
end
