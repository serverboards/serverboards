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
