# Serverboards Plugins

Plugins at Serverboards use JSON-RPC to communicate via stdin/stdout.

## Environment variables

These variables are set when calling Serverboards, but for testing
some safe values should be assumed:

* `SERVERBOARDS_PATH` -- Path to the Serverboards installation.
  `~/.local/serverboards/`
