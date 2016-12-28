# Serverboards Configuration

Serverboards uses a cascading configuration. When looking for some configuration
item, it searches in these elements in order until found.

* Environment variables: SERVERBOARDS_SECTION_KEY
* Config files: SERVERBOARDS_PATH/serverboards.ini, /etc/serverboards.ini
* Database data, configured using the UI
* Default values

Lowercase/uppercase for the section and key is not important except for evnvvars
where the id must be upper case.

Plugins may set their own sections setting the plugin id as section id.

# Core Sections

## global

### home

Where serverboards should store its own data. On this directory it will store
downloaded plugins, plugin data and in general anything that it may store,
except database data.

## logs

Several logging may be activated at the same time.

### systemd

Whether to store logs on systemd's journal

### console

Use enhanced serverboards console logging. Useful for development

### classic

Use classic Elixir logging.

## database

### url

Database url, in the mode of: `postgresql://USERNAME:PASSWORD@SERVER/DATABASE`.

## http

### port

Port to listen http connection

May be false to do not do http listening.

### root

Where the UI static data is stored.

## tcp

### port

Port to listen for deugging TCP connections. Uses the same JSON-RPC protocol.
Should not be public, but it can do exactly the same as the websocket
connection.

May be false to disable.

## plugins

Set the key to any plugin id, and value to false to disable it.

## broken-plugins

Set the key to any plugin id, and value to false to mark as broken. Normally
this is used internally and users should not modify it.


# Important plugin Sections

## serverboards.core.settings/base

### base_url

Base url of the UI
