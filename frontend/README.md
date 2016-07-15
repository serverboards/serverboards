# Serverboards frontend

The Serverboards front end uses ReacJS, Semantic UI and JSON-RPC over WebSockets.

Latest frontend version is always compiled at dist/ subdirectory, to easy backend development
without the frontend tools, and to ease deployment.


## Development tips

Ser localStorage.servername to set an alternative dynamic server for plugin
static data and for websockets. This is very usefull for developing.

```
>>> localStorage.servername="http://localhost:8080"
```


Set localStorage.ws_url to the WS url, so you can use webpack hot reload server.
It overrides the `localStorage.servername`:

```
>>> localStorage.ws_url="http://localhost:8080/ws"
```
