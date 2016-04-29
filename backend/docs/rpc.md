# Core serverboards RPC calls

# Core

## dir()

Returns list current available methods

## ping()

Returns "pong". To check conectivity.

# Auth

## auth.auth({type, ...})

Tries to do login. If succesfull returns a struct with

* email
* perms

If not success, returns false.

## auth.user()

Returns current user

# Plugins

Require `plugin` permission

## plugin.start("pluginname/component")

Returns an UUID to be referenced as the plugin

## plugin.alias(uuid, alias)

Creates an alias for that UUID. Only local to caller.

## plugin.call(uuid or alias, method, params)

Performs the call on that uuid or allias

## plugin.stop(uuid or alias)

Stops the plugin.

# Services and components

## service.add(shortname, attributes)

## service.update(shortname, attributes)

## service.delete(shortname)

## service.list()

## service.info(shortname)

## component.add(attributes) -> UUID

## component.delete(uuid)

## component.update(uuid, attributes)

## component.list(filter \\ [])

## component.info(uuid)

## component.attach(service_shortname, component_uuid)

## component.detach(service_shortname, component_uuid)
