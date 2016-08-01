# Serverboards Backend

Serverboads is composed on a backend and a frontend. This module is the backend.

It is developed using the Elixir Programming Language 1.2.

## 10000 ft view

Serverboards backend is an integration platform that takes charge of
coordinating the frontend and the plugins, with some builtin functionality for
authentication and data storage.

All external communication is done via JSON RPC.

Check docs directory for in detail architecture.

## Running the server

```shell
$ mix run --no-halt
```

## Command line tool

There is a command line tool at cmd/serverboards.py that allows to easy
perform use of the backend. It connects via localhost:4040, and lets
user write simplified RPC calls:

```shell
> version
0.0.1
> auth.auth email:user@example.com password=1234
{"email":"user@example.com", "perms":[...]}
> echo "Hola mundo"
"Hola mundo"
```

## Command line considerations for backend

### Environmental vars:

* SERVERBOARDS_DB -- postgres://username:password@hostname/dbname
* SERVERBOARDS_SERVER -- true -- Run the server mode (TCP/HTTP)

### Scripts

Check scripts at scripts/* as they contain several day to day management tasks,
as updating permission list needed after new deployments.

Running should be as:

```shell
$ SERVERBOARDS_SERVER=false mix run scripts/perms.exs
```
