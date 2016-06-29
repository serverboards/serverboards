# General architecture

* [Message Oriented Middleware](https://en.wikipedia.org/wiki/Message-oriented_middleware)
* Use JSON RPC for everything.
* Messages come from WebSockets, TCP, or IO.
* Ports need authentication when the communication is externally initiated.z
* Reuse [HTTP status codes](https://en.wikipedia.org/wiki/List_of_HTTP_status_codes)
  where possible.

### Example notation

Examples are using function call notation, but on-wire it uses JSON RPC. For
example:

```js
SRV(*)> auth.required(["basic","token"])
WSC> auth.auth(type: "basic", email: "dmoreno@serverboards.io", password: "my-secret-password")
<SRV True
```

Means this JSON communication:

```JS
# to client
{"method":"auth.required", "params":[ "basic", "token" ]}
# to server
{"method":"auth.auth", "id":0, "params" :
	{ "type":"basic", "email":"dmoreno@serverboards.io", "password":"my-secret-password" }
}
# to client
{"id":0, "response": True}
```

Message number can be omitted when its not important or just linear
request-response.

Message number can be `*` for notifications (no message id on JSON):

```js
SRV(*)> auth.required('basic','token')
```

When more actors appear, a dash is used to indicate between which two actors is
this message.

# Core Subsystems

## Authentication

Server starts by asking credentials, with list of options, if receives another
request, always answer with error "403 Forbidden":

```js
SRV(*)> auth.options("basic","token")
WSC> auth.auth(type: "basic", email: "dmoreno@serverboards.io", password: "wrong-password")
<SRV ERROR("404 Forbidden")
WSC> auth.auth(type: "basic", email: "dmoreno@serverboards.io", password: "my-secret-password")
<SRV "d06200e2-bfb6-4afb-97fd-5e3cccf43373"
```

Or if not authenticated and tries to do something

```js
SRV(*)> auth.options("basic","token")
WSC(0)> plugin.start("core.ssh")
<SRV(0) ERROR("404 Forbidden")
WSC(0)> auth.auth(type: "basic", email: "dmoreno@serverboards.io", password: "my-secret-password")
<SRV(0) "d06200e2-bfb6-4afb-97fd-5e3cccf43373"
WSC(1)> plugin.start("core.ssh")
<SRV(1) "523ee539-6da0-4633-a862-590522385f8d"
```

### auth.options("option1","option2")

Event message from core to client to mark needs authentication. Gives authentication
options. Several messages can appear for example for two factor authentication.

There is no possible answer from client; this is just a notification/event.

### auth.auth(type: type, auth-dependant-options: ... )

Sends the type of message in `type`, from the list of allowed at `auth.options`.
Other named parameters are as needed by the auth method.

If success returns the UUID of this client, which can be ignored or reused if
some other peer needs to communicate with this one.

On error, an string `"404 Forbidden"` is returned as an error, and authentication
should continue. The core may close connection after many tries, or force
waits.

## Plugins

Plugins can be started using method `plugin.start("plugin.component.code")`. It
returns an UUID that should be used in subsequent calls to this plugin. For
example

Stop is via `plugin.stop(UUID)`.

Calls inside each plugin is composing the UUID with the function to call:

```js
WSC-SRV> plugin.start("core.ssh")
-- Server starts the plugin.
<SRV-WSC "9ee46cf9-286f-49da-8db2-f9a931d8c84e"
WSC-SRV> 523ee539-6da0-4633-a862-590522385f8d.run("ls /")
-- Server resends the request to the proper plugin
  SRV-PLG> run("ls /")
  <PLG-SRV "bin lib usr proc sys"
-- answer back to websocket
<SRV-WSC "bin lib usr proc sys"
```


### plugin.start("plugin.id")

Starts the plugin by id. The id is the concatenation of the plugin id and the
component it.

Returns the UUID of the started component.

### plugin.stop(plugin-uuid)

Stops the plugin. Only owner of the plugin can stop it.

# Appendix A: Core methods

* auth.options
* auth.auth
* plugin.start
* plugin.stop
