# Serverboards default MOM Channels

Serverboards uses Serverboards.MOM as a Message Oriented middleware.

It defines several default channels that can be used internally, subscribed
to, or tapped using RPC.

# Default channels

* `:invalid` -- Messages that were tried to be processed, but are not valid, for
  example wrong format.
* `:deadletter` -- Messages that were not processed by anybody.

# Auth channels

* `:auth_authenticated` -- payload: `%{ client, user }`. New user authenticated,
  can be used to add new functionality to such user based on user and
  permissions.

# Client events

* `:client_events` -- payload: `%{ type, data, guard, ...}`

`type` must be a verb in past tense, scoped into the module that emmited it.

There is a system wide channel for system events, `:client_events`, in which
anyone can post a status change.

Clients must subscribe to specific events, and they will receive a RPC event
call for the given event with the data.

The Elixir way to create this events is:

```
MOM.Channel.send(
  :client_events,
  %MOM.Message{
    payload: %{
      type: "service.deleted",
      data: shortname,
      guard: fn msg, user -> true end
      }
    }
  )
```

Payload must have both `type` and `data`.

If `guard` is present it will be called with the current message and the user
associated to such client connection.

Any other field is present it can be used by `guard`.

Then on every client it will be checked if the type is subscribed, if so, the
guard will be checked, and if true the event will be sent.

This way guards can be used to do not show services to users that have no access
to such service, and so on.

Use from plugins will be provided via an API that will give sensible guard
defaults.
