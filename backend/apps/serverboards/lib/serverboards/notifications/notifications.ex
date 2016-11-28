require Logger

defmodule Serverboards.Notifications do
  @moduledoc ~S"""
  Notifications is a way to comunicate some events to the user. There is no
  fixed set of ways to communicate, as they can be expended via plugins.

  Each user can define the ways (channels) it wants the communications to come
  from, normally being at least email and inapp.

  Channels are defined at plugins as a method to call with the user data,
  configuration of the channel and subect body and options of the message.
  """

  alias Serverboards.{Repo, Plugin, Auth}
  alias Serverboards.Notifications.Model.ChannelConfig

  def start_link(_options \\ []) do
    {:ok, es} = EventSourcing.start_link name: :notifications
    EventSourcing.Model.subscribe es, :notifications, Serverboards.Repo
    EventSourcing.subscribe es, :config_update, fn
      %{ email: email, channel: channel, is_active: is_active, config: config}, _me ->
        config_update_real(email, channel, config, is_active)
    end
    EventSourcing.subscribe es, :notify, fn
      %{ email: email, subject: subject, body: body, extra: extra}, _me ->
        Task.start(fn -> 
          notify_real(email, subject, body, extra)
        end)
    end

    Serverboards.Notifications.InApp.setup_eventsourcing(es)

    Serverboards.Notifications.RPC.start_link []

    {:ok, es}
  end

  @doc ~S"""
  Returns all available channels.
  """
  def catalog do
    Plugin.Registry.filter_component(type: "notification")
    |> Enum.map(fn c ->
      fields = case c.extra["fields"] do
        nil -> []
        other -> other
      end
      %{
        channel: c.id,
        name: c.name,
        fields: fields,
        command: c.extra["command"],
        call: c.extra["call"],
        description: c.extra["description"]
      }
    end)
  end

  @doc ~S"""
  Notify to user as configured by it.

  * email is the user's email to identify it.
  * subject
  * body
  * extra:
    - all: true -- Send to all configured channels
    - type: str -- Type of the comunication: info, error...
    - ...: Custom from origin

  Options itself is passed to the notification channel handler, so it may contain
  extra required configuration, as notification type.

  It will call via RPC to the configured method as
    send(config, subject, message, options)

  config has the channel configuration plus the user data (as map email, perms, groups).
  """
  def notify(email, subject, body, extra, me) do
    extra = Map.new extra
    EventSourcing.dispatch(
      :notifications, :notify,
      %{ email: email, subject: subject, body: body, extra: extra },
      me.email)
    :ok
  end

  def notify_real(who, subject, body, extra) do
    if String.starts_with?(who,"@") do
      Logger.debug("Notifying group #{inspect who}", subject: subject, body: body, extra: extra)
      me = %{ email: "system", perms: ["auth.info_any_user"]}
      for email <- Serverboards.Auth.Group.user_list(String.slice(who, 1, 1000), me) do
        notify_real_one(email, subject, body, extra)
      end
      {:ok, true}
    else
      notify_real_one(who, subject, body, extra)
    end
  end

  def notify_real_one(email, subject, body, extra) do
    {:ok, user} = Auth.User.user_info(email, %{ email: email})
    extra = extra
      |> Map.merge(%{ "email" => email, "user" => user })

    {:ok, subject} = Serverboards.Utils.Template.render(subject, extra)
    {:ok, body} = Serverboards.Utils.Template.render(body, extra)

    Logger.debug("Extra data for notification: #{inspect extra}\n#{subject}\n#{body}")

    :ok = Serverboards.Notifications.InApp.notify(
      email,
      String.slice(subject, 0, 255),
      body,
      extra
      )

    cm = Map.new(
      config_get(email)
      |> Map.to_list
      |> Enum.filter( &(elem(&1,1).is_active) )
      |> Enum.map( &({elem(&1,0), elem(&1,1).config}) )
    )

    cm = if cm == %{} do
      Logger.debug("Sending email as no notification channels configured")
      %{ "serverboards.core.notifications/email" => %{} }
    else
      cm
    end
    Logger.debug("Notifications config map #{inspect cm}")

    for c <- catalog do
      config = cm[c.channel]
      if config do
        notify_real(user, c, config, subject, body, extra)
      else
        :not_enabled
      end
    end
  end

  @doc ~S"""
  Updates the configuration of a user
  """
  def config_update(email, channel, config, is_active, me) do
    EventSourcing.dispatch(
      :notifications, :config_update,
      %{ email: email, channel: channel, config: config, is_active: is_active },
      me.email)
    :ok
  end

  defp config_update_real(email, channel, config, is_active) do
    {:ok, user} = Auth.User.user_info(email, %{ email: email})
    changes = %{ user_id: user.id, config: config, is_active: is_active, channel: channel }
    import Ecto.Query

    case Repo.all(from c in ChannelConfig,
              where: c.user_id == ^user.id and c.channel == ^channel )
      do
        [] ->
          Repo.insert(ChannelConfig.changeset( %ChannelConfig{}, changes ))
        [prev] ->
          Repo.update(ChannelConfig.changeset( prev, changes ))
    end
  end

  @doc ~S"""
  Gets all configs for that user email
  """
  def config_get(email) do
    import Ecto.Query
    Repo.all(from c in ChannelConfig,
            join: u in Auth.Model.User,
              on: u.id == c.user_id,
            where: u.email == ^email,
            select: {c.channel, %{ is_active: c.is_active, config: c.config }} )
      |> Map.new
  end

  @doc ~S"""
  Gets a specific configuration, of a given channel
  """
  def config_get(email, channel_id) do
    import Ecto.Query
    Repo.one(from c in ChannelConfig,
            join: u in Auth.Model.User,
              on: u.id == c.user_id,
            where: u.email == ^email and c.channel == ^channel_id,
            select: %{ is_active: c.is_active, config: c.config } )
  end

  @doc ~S"""
  Do the real notification on a channel given some configuration.
  """
  def notify_real(user, channel, config, subject, body, extra) do
    Logger.info("Sending notification to #{user.email} via #{channel.channel}")
    command_id = channel.command
    params = %{
      user: user,
      config: config,
      message: %{
        subject: subject,
        body: body,
        extra: extra
      }}
    {ok, ret} =
      with {:ok, plugin} <- Plugin.Runner.start( command_id ),
        do: Plugin.Runner.call(plugin, channel.call, params)
    if ok == :error do
      Logger.error("Error sending message to #{command_id} / #{inspect user.email}", params: params, ret: ret, user: user, channel: channel, config: config)
    end
    {ok, ret}
  end
end
