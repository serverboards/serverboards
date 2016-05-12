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

## auth.set_password(password)

Changes current user password

## auth.create_token

Creates an access token for current user

## group.list
## group.add(name)
## group.remove(name)

## group.list_perms
## group.add_perm(group, perm)
## group.remove_perm(group, perm)

## group.list_users
## group.add_user(group, email)
## group.remove_user(group, email)

## user.list
## user.add(user_struct)
## user.update(email, operations)

User struct is a dict with: {email, first_name, last_name, is_active}

## user.update(email, operations)

Updates user data, for example {"is_active": false, "first_name": "new name"}.

Note that there is no user remove, there is only deactivation via
is_active: false.


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
