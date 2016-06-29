# Serverboards
https://serverboards.io

**This is still work in progress. Use with caution.**

----

Serverboards is a microservices based service consolidation, monitoring,
alerting and management system.

Serverboards is based on a simple core that is in charge of communication
of all the microservices, doing all the common tasks that are needed:

* User management
* Permissions
* Plugin management
* Notifications
* Issues

## Collaborate / Develop with Serverboards

Please use the issue tracker at [github](https://github.com/serverboards/serverboards/issues)
to report bugs and feature requests.

It is developed under the Apache 2 license, and plugins can be developed
by third parties using any license. Please refer to https://serverboards.io/developers/ for more information.

There are forums in place at https://disqus.com/home/channel/serverboards/

Subscribe to our newsletter https://serverboards.io

## Running the server

The main shell script understands basic start/stop commands.

```shell
$ ./serverboards.sh start
...
$ ./serverboards.sh stop
```
