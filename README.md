# Serverboards
https://serverboards.io

[![build status](https://git.coralbits.com/serverboards/serverboards/badges/master/build.svg)](https://git.coralbits.com/serverboards/serverboards/commits/master)

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

## Download

Serverboards can be downloaded to be used on Ubuntu 16.04 (and maybe others) at
https://serverboards.io

Once downloaded install it with `dpkg -i serverboards.deb` and do a `apt -f
install` to ensure all dependencies are downloaded.

Access it at http://localhost:8080, and enter with your user and password. If
your user is in the adm group it will have admin access, and can add other users
and disable PAM access.

## Compiling and running the server

If you plan to develop Serverboards core itself, first compile it once to ensure
you have all the required dependencies:

```shell
make
```

And then you may run it executing these commands in two different terminals:

Terminal 1:
```shell
cd backend
iex -S mix
```

Terminal 2:
```shell
cd frontend
npm start
```

Alternatively you can create the release with `make release` and run it as `rel/serverboards/bin/serverboards foreground`.
