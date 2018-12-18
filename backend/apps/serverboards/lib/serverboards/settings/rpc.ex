require Logger

defmodule Serverboards.Settings.RPC do
  alias MOM.RPC
  alias MOM.RPC.Context
  alias MOM

  # this sections do not need special permissions when got from other user
  @user_whitelist ~w"profile_avatar"
  @settings_whitelist ~w"ui serverboards.core.settings/base"

  def start_link(options \\ []) do
    {:ok, mc} = RPC.MethodCaller.start_link(options)
    import Serverboards.Settings

    # Adds that it needs permissions.
    Serverboards.Utils.Decorators.permission_method_caller(mc)

    RPC.MethodCaller.add_method(
      mc,
      "settings.list",
      fn [], context ->
        all_settings(Context.get(context, :user))
      end,
      required_perm: "settings.view",
      context: true
    )

    RPC.MethodCaller.add_method(
      mc,
      "settings.update",
      fn
        [section, changes], context ->
          update(section, changes, Context.get(context, :user))

        [section, key, nil], context ->
          changes =
            Serverboards.Settings.get(section, %{})
            |> Map.drop([key])

          update(section, changes, Context.get(context, :user))

        [section, key, value], context ->
          changes =
            Serverboards.Settings.get(section, %{})
            |> Map.put(key, value)

          update(section, changes, Context.get(context, :user))
      end,
      required_perm: "settings.update",
      context: true
    )

    RPC.MethodCaller.add_method(
      mc,
      "settings.get",
      fn
        [section], context ->
          user = RPC.Context.get(context, :user)
          perms = user.perms

          can_view =
            "settings.view" in perms or "settings.view[#{section}]" in perms or
              section in @settings_whitelist

          if can_view do
            get_from_db_or_ini(section)
          else
            Logger.error(
              "Try to access settings #{section}, with permissions #{inspect(perms)} // #{
                inspect(user.email)
              }",
              section: section,
              user: user.email
            )

            {:error, :not_allowed}
          end

        [section, defval], context ->
          user = RPC.Context.get(context, :user)
          perms = user.perms

          can_view =
            "settings.view" in perms or "settings.view[#{section}]" in perms or
              section in @settings_whitelist

          if can_view do
            case get_from_db_or_ini(section) do
              {:error, :not_found} ->
                defval

              nil ->
                defval

              other ->
                other
            end
          else
            Logger.debug(
              "Try to access settings #{section}, with permissions #{inspect(perms)} // #{
                inspect(user.email)
              }"
            )

            {:error, :not_allowed}
          end
      end,
      context: true
    )

    RPC.MethodCaller.add_method(
      mc,
      "settings.user.get",
      fn
        [section], context ->
          user = RPC.Context.get(context, :user)
          can_view = "settings.user.view" in user.perms

          if can_view do
            Serverboards.Settings.user_get(user.email, section)
          else
            {:error, :not_allowed}
          end

        [user, section], context ->
          me = RPC.Context.get(context, :user)
          can_view = "settings.user.view_all" in me.perms or section in @user_whitelist

          if can_view do
            Serverboards.Settings.user_get(user, section)
          else
            {:error, :not_allowed}
          end
      end,
      context: true
    )

    RPC.MethodCaller.add_method(
      mc,
      "settings.user.set",
      fn
        [section, data], context ->
          user = RPC.Context.get(context, :user)
          can_update = "settings.user.update" in user.perms

          if can_update do
            Serverboards.Settings.user_update(user.email, section, data, user.email)
          else
            {:error, :not_allowed}
          end

        [user, section, data], context ->
          me = RPC.Context.get(context, :user)
          can_update = "settings.user.update_all" in me.perms

          if can_update do
            Serverboards.Settings.user_update(user, section, data, me.email)
          else
            {:error, :not_allowed}
          end
      end,
      context: true
    )

    # Add this method caller once authenticated.
    MOM.Channel.subscribe(:auth_authenticated, fn %{payload: %{client: client}} ->
      # Logger.debug("New client, has perms: #{inspect (RPC.Client.get client, :user)}")
      RPC.Client.add_method_caller(client, mc)
      :ok
    end)

    {:ok, mc}
  end

  def get_from_db_or_ini(section) do
    case Serverboards.Settings.get(section) do
      {:ok, val} ->
        val

      {:error, err} ->
        if String.contains?(section, "/") or section in @settings_whitelist do
          Map.new(Serverboards.Config.get_ini(section) ++ Serverboards.Config.get_env(section))
        end
    end
  end
end
