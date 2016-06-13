defmodule Serverboards.Notifications do

  @doc ~S"""
  Returns all available channels.
  """
  def get_channels do
    Serverboards.Plugin.filter(type: "notification")
  end

  @doc ~S"""
  Notify to user as configured by it.

  * email is the user's email to identify it.
  * title
  * message
  * options:
    - all: true -- Send to all configured channels
    - type: str -- Type of the comunication: info, error...

  Options itself is passed to the notification channel handler, so it may contain
  extra required configuration, as notification type.

  It will call via RPC to the configured method as
    send(config, title, message, options)

  config has the channel configuration plus the user data (as map email, perms, groups).
  """
  def notify(email, title, message, options \\ []) do

  end
end
