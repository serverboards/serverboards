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

  alias Serverboards.Plugin
  @doc ~S"""
  Returns all available channels.
  """
  def catalog do
    Plugin.Registry.filter_component(type: "notification")
    |> Enum.map(fn c ->
      %{
        id: c.id,
        name: c.name,
        fields: c.extra["fields"],
        command: c.extra["command"],
        call: c.extra["call"]
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

  Options itself is passed to the notification channel handler, so it may contain
  extra required configuration, as notification type.

  It will call via RPC to the configured method as
    send(config, subject, message, options)

  config has the channel configuration plus the user data (as map email, perms, groups).
  """
  def notify(email, subject, body, extra \\ []) do

  end

  @doc ~S"""
  Do the real notification on a channel given some configuration.
  """
  def notify_real(user, channel, config, subject, body, extra) do
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
      Logger.error("Error running #{command_id} #{inspect params}: #{inspect ret}")
    end
    {ok, ret}
  end
end
