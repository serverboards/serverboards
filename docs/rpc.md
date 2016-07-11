# Core serverboards RPC calls

This is a list of all serverboards calls that the core provides. Each plugin can
provide extra calls that will be documented on each module.

# Core

## dir()

Returns list current available methods

```js
dir()
```

## ping()

Returns "pong". To check conectivity.

```js
ping()
```

# Auth

## auth.auth({type, ...})

Tries to do login. If succesfull returns a struct with

* email
* perms

If not success, returns false.

```js
auth.auth({
  type: "basic",
  username: "test@serverboards.io",
  password: "aaaaaaaa"
})
// returns user data as in auth.user
auth.auth({
  type: "token",
  token: "2b8c390c-12ba-4948-819e-bda8d834c1db"
})
// or false
```


## auth.user()

Returns current user

```js
auth.user()
```

Result:
```json
{
  "is_active": true,
  "first_name": "David",
  "last_name": "Moreno",
  "id": 115,
  "email": "dmoreno@serverboards.io",
  "perms": [
    "auth.modify_self",
    "auth.create_token",
    "auth.manage_groups",
    "auth.modify_any",
    "auth.create_user",
    "auth.info_any_user",
    "auth.modify_groups",
    "auth.modify_self",
    "auth.create_token",
    "plugin"
  ],
  "groups": [
    "admin",
    "user",
    "other"
  ]
}
```


## auth.set_password(password)

Changes current user password

```js
auth.set_password("newpassword")
```

## auth.create_token

Creates an access token for current user

```js
auth.create_token()
```

Result:
```json
"2b8c390c-12ba-4948-819e-bda8d834c1db"
```

## group.list

Returns the list of all groups in the system.

```js
group.list()
```

Result:
```json
[
  "admin",
  "user",
  "developers",
  "external",
  "other"
]
```

## group.add(name)

Adds a new group

```js
group.add("newgroup")
```

Result:
```json
"ok"
```

Requires `group.manage_groups` permission.

## group.remove(name)

Adds a new group

```js
group.remove("newgroup")
```

Result:
```json
"ok"
```

Requires `group.manage_groups` permission.

## group.list_perms(group)

Lsits all permissions on that group.

## group.add_perm(group, perm)

Adds a permissions to that group.

## group.remove_perm(group, perm)

Removes a permission from the group.

## group.list_users(group)

Returns a list of all the users at that group. Only returns the emails.

## group.add_user(group, email)
## group.remove_user(group, email)

## user.list

Returns a list of users with email, first_name, last_name, is_active and groups.

## user.add(user_struct)

Adds a user.

## user.update(email, operations)

User struct is a dict with: {email, first_name, last_name, is_active}

## user.update(email, operations)

Updates user data, for example {"is_active": false, "first_name": "new name"}.

Note that there is no user remove, there is only deactivation via
is_active: false.

## perm.list()

Returns a list of all the permissions known by the system.

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


## plugins.data_set(id, key, value)

Sets some data for some plugin id in a given key. Value must be a map.

Needs plugins.data or plugins.data[pluginid] permission.

```js
plugins.data_set("serverboards.core.notifications/telegram", "user_to_map",{
  "dmoreno@serverboards.io": 12312312312
})
```

NOTE: It does not currently check the plugin name is vlid and can be used thus
to store data unrelated to plugins or shared between plugins, but anyway the
name should be scoped to avoid collissions, and explanatory. *It is highly
encouraged to use the plugin or plugin/component id.*

## plugins.data_get(id, key)

Returns the data of the given section

Needs plugins.data or plugins.data[pluginid] permission.

```js
plugins.data_get("serverboards.core.notifications/telegram", "user_to_map")
```

```js
{
  "dmoreno@serverboards.io": 12312312312
}
```

# Serverboards

## serverboard.add(shortname, attributes)

## serverboard.update(shortname, attributes)

## serverboard.delete(shortname)

## serverboard.list()

## serverboard.info(shortname)

# Services

## service.add(attributes) -> UUID

## service.delete(uuid)

## service.update(uuid, attributes)

## service.list(filter \\ [])

## service.info(uuid)

## service.attach(serverboard_shortname, service_uuid)

## service.detach(serverboard_shortname, service_uuid)

# event

Clients can subscribe to an event type, and will be notified when that event happens.

Events can have guards to prevent being sent to clients without the proper
permissions.

Requires `event.subscribe` permission. Without this permission the
client can not subscribe to any event type topic.

## event.subscriptions()

Returns a list with all the subscriptions.

## event.subscribe(event_type)

Subscribes to a event_type. All events that this client is allowed to see on
of that type will be emited.

```js
event.subscribe("user.updated")
```

## event.unsubscribe(event_type)

Stop receiving updates on that event_type topic.

```js
event.unsubscribe("user.updated")
```


## event.emit(event_type, extra, guards)

  * `event_type` -- Type of the event, properly scoped (plugin.type)
  * `extra` -- Extra values required to properly update the status
  * `guards` -- Guard expression to prevent being sent to not allowed clients

The guards can be:

 * A list of user required permissions.
 * A dict with `perms` and `context` keys. Perms is the list of required perms,
  and context is a path describing the context, for example: `/serverboard/test`.

Example:

```js
// Has a global foo.bar permission
event.emit("foo.bar", {"text":"hello world"}, ["foo.add"] )
// Has a foo.bar permission at /service/FOO
event.emit("foo.bar", {"text":"hello world"}, {
  "context" : "/service/FOO",
  "perms" : ["foo.add"]
})
```

Requires `event.emit` permission.

# Settings

## settings.all()

Returns all settings this user can see

## settings.update(section, data)

Updates one sections data.

# Action

## action.filter(filter_q)

Returns actions that fit that query

```js
action.filter({trait: ip})
/// {}
```

## action.trigger(action_id, params)

Manually executes an action.

Returns an UUID that can be used for action watching.

Example:

```js
action.trigger("core.actions/ping", { ip: "192.168.1.1" })
// "8f3e8f70-acf4-4b2d-b929-ec8efed82c26"
```

## action.ps()

Lists all running processes with running info.

## action.history()

Returns all the action history: past and current

# Notifications

Notifications send messgaes via the user configured channels

## notifications.catalog()

Returns the catalog of available notification channels

## notifications.config(email)

Returns the notification channels configured by this user

## notifications.config_update(email, channel, config, is_active)

## notifications.notify(email, subject, body, extra)

extra is some extra information that may be used by the channels to adapt
to the message, for example, alert level.

# Rules

## rules.update(rule)

If uuid is NULL creates the rule. The rule format is:

```js
rules.update( {
  uuid: null,
  service: nil,
  trigger: {
    trigger: "serverboards.test.auth/periodic.timer",
    params: { period: 0.5 }
  },
  actions: {
    tick: {
      action: "serverboards.test.auth/touchfile",
      params: {
        filename: "/tmp/sbds-rule-test"
      }
    }
  }
} )
```

## rules.list(filter)

Returns a list of rules, in the rule format. Applies the given filter:

* id
* traits -- any of the given traits

## rules.catalog(filter)

Return the list of triggers that comply with thegiven filter
