# Plugin

Elixir module that manages the plugins in serverboards.

## Plugin structure

Plugins are directories with a manifest.yaml. The manifest defines general data
about the plugin, and each of the components.

Plugins are defined as:

* name
* author
* version
* id
* url (optional)
* description (optional)

* components -- List of components

Each plugin has `components`, each with:

* name
* id
* version
* type
* description (optional)

And some custom fields depending on the type.

The ids must be unique but descriptive, and they are composed to get the final
id of each component, for example a plugin id of "serverboards.ls" with a
component id of "ls" finally resolves to a component full if of
"serverboards.ls.ls".

Its good practive to call the plugin with a qualified name with the first part
an id of the creator, and then the plugin name as id. Spaces and other symbols
can be used, but are not recommended.

Each component can be of one of
the following types:

  * ui.sidemenu -- Button on the side with an internal link
  * ui.screen -- New screen with general data
  * ui.widget -- A generic widget, normally subclassed
  * ui.server.menu -- Button per server with internal link
  * ui.server.screen -- New screen associated to server
  * ui.server.config.user -- Widget to configure something on server
  * ui.board.widget -- New serverboard widget
  * ui.user.config.widget -- Widget to configure something about the user
  * ui.system.config.widget -- Widget for system configuration
  * ui.* -- Plugins can require other ui.* type of plugins

  * cmd -- Runs a plugin command and use the RPC for communication
  * cmd.widget

Versioning must use semantic versioning: three parts, first the major version,
fully incompatible with other versions, second component minor version, which
should be compatible with previous versions on the same major version, and
finally revision, with just bug fixes, but no API or compatibility changes.
Serverboards depends on these semantics to provide plugin upgrade mechanisms.
