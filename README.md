# Serverboards
https://serverboards.io

Serverboards is a [Service] [Integration] [Platform] that eases the integration of other services.

It provides all the plumbing necessary to interconnect your services.

<p align="center">
  <img src="docs/screenshot1.png" title="Dashboard"/>
</p>

[Service]: https://en.wikipedia.org/wiki/Service_(systems_architecture)
[Integration]: https://en.wikipedia.org/wiki/System_integration
[Platform]: https://en.wikipedia.org/wiki/Cloud-based_integration


# Example use cases

For example you can connect to your WordPress database, to Google Analytics, and
to MailChimp to do a detailed tracking of your mailing campaings on our
Dashboards.

Or automate some webhook connection to the integrated messaging system and
google drive so all contact requests are archived and sent to the proper actors.

Serverboards makes it easy for you to control your IT Infrastructure from a
single dashboard. Servers, virtual machines, websites, databases and more can be
monitored or managed in an easy way.

# Main Features

* Services
* Dashboards
* Rules
* Notifications
* Issues
* Screens
* Plugins and [Marketplace]: 25 packages and counting

[Marketplace]: https://serverboards.app/packages/

## Services: Connect to all your services

Serverboards main element are services. Once you have configured the access to
your services, you can start using them at the dashboards, the screens or the
rules.


<p align="center">
  <img src="docs/screenshot2.png" title="Dashboard"/>
</p>

Just by configuring the services you get automatic monitoring and an issue will
be generated and the users notified when the service is no longer accessible.
Depending on the service it may mean different things, as DNS could not be
resolved, the SSL certificate expired, or the user and password changed. In any
case you will know and be able to take corrective measures.

## Dashboards: Monitor the hidden information of your KPIs

Dashboards are windows into the data of your infrastructure. It may be a purely
technical one for IT management, or it may be a Marketing oriented with data
from your Google Analytics and Facebook Ads.

<p align="center">
  <img src="docs/screenshot1.png" title="Dashboard"/>
</p>

We use our own USQ technology that allows us to merge information from many
sources, for example getting the visits from Google Analytics, and merging via
the URL to your WordPress installation to show which of your tags are more
popular.

Universal Service Query is [our
technology](https://github.com/serverboards/exosql/) that merges data from many
sources and can be used form a single SQL query. And creating the data
extractors is a 10 lines of code exercise for the developers.


## Rules: Automated work flows made easy with our GUI-based rules composer

Easily monitor your server performance in real time, manage your virtual
machines and automate most common infrastructure issues.

<p align="center">
  <img src="docs/screenshot6.png" title="Rules">
</p>

## Notifications: Get notified of the important events wherever you want

Serverboards is super extensible. Not extensible, super extensible. Everything
can be expanded and built upon. Notifications is no less and its possible to
create components that notify your users however you want.

Of course there is a built in email notification system, and there is a
[Telegram](https://serverboards.app/packages/serverboards.telegram/) one
on the Marketplace.

## Issues: Built in Issues and Logs with alerting

If something happens, you can access the traces in our in-built logging solution
and identify what caused the error.

<p align="center">
  <img src="docs/screenshot3.png" title="Alerting"/>
</p>

There is a log per service that let you see all important actions performed and
when, by you or by packages. All modifications and uses are properly registered.
And errors give meaningful descriptions to be able to diagnose and fix them.

## Screens: Extend Serverboards in ways nobody thought about

For example Serverboards comes with an embedded SSH terminal. This way console
actions can be performed from Serverboards itself to troubleshoot faster.

<p align="center">
  <img src="docs/screenshot4.png" title="Terminal"/>
</p>

There are many other screens available: [Spice Remote
Desktop](https://serverboards.app/packages/serverboards.spice/), [Simple
backups](https://serverboards.app/packages/serverboards.optional.backups/),
[Cloud
Management](https://serverboards.app/packages/serverboards.optional.cloud/) and
many others.

Using screens you can use all Serverboards security, users, and connectivity to
create custom back office applications to manage your businesses.


## Packages and Marketplace: Plugin based

Serverboards is based on simple to develop plugins that do all the small tasks
like checking if a service is UP, gathering the information and showing
information to the user, letting Serverboards Core do all the orchestration and
heavy work.

<p align="center">
  <img src="docs/screenshot5.png" title="Alerting"/>
</p>

Starting with 18.10 we created a
[Marketplace](https://serverboards.app/packages/) that allows users to install
new packages from Serverboards itself in the place where they could need it. For
example, if they are adding services, it is possible to select them from the
marketplace and install them directly from the service add screen.

In time we want to show developer created applications and packages that can
benefit from being in the integration platform, that access all the data they
need, and more importantly that are secure.

There is a full simple to use [API for
development](https://serverboards.io/developers/). Once you start using it, you
will not believe how easy is to just center on your problem, and forget about
all the scaffolding normally necessary to create this kind of integrations.

# Get started!

## Install and Download

Serverboards can be downloaded to be used on Ubuntu 18.04 (and maybe others) at
https://serverboards.io/downloads/

There are full instructions about how to start and first steps.

If you are not using Ubuntu 18.04, please contact us or try the developer
installation instructions.

# Develop!

## Collaborate / Develop with Serverboards

Serverboards is licensed under the Apache 2 license, and plugins can be
developed by third parties using any license. Please refer to
https://serverboards.io/developers/ for more information.

* Issue tracker at [github](https://github.com/serverboards/serverboards/issues)
* Forums for troubleshooting and hanging around at
  https://forum.serverboards.io/
* Subscribe to our newsletter at https://serverboards.io

Serverboards uses the [Elixir Language](https://elixir-lang.org/) for the
backend, [Python](https://www.python.org) for plugins and
[JavaScript](https://developer.mozilla.org/en-US/docs/Web/javascript)/[React](https://reactjs.org/)
for the frontend and plugins.

To develop plugins we recommend to use Python and JavaScript/React, but basic
Python and/or HTML + JS should be enough depending on what you want to achieve.
Contact us if you have any idea and need help to make it work!

## Compiling and running the server

If you plan to develop Serverboards core itself, first install all
prerequisites:

* Erlang 20.x
* Elixir 1.6.x

Check `scripts/setup-ubuntu-1804.sh` as a guide on what to install and how. It
works for Ubuntu 18.04, but should work for others.

Then compile it once to ensure you have all the required dependencies:

```shell
make compile
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

Now you can connect to the backend at http://localhost:8080 or at the running
webpack server at http://localhost:3000 .

If you connect to the webpack server it is necessary to force the backend URL so
that the WebSocket can connect. Open the developer console at the browser (F12
or Crtl+Shift+C), and write:

```js
localStorage.servername="http://localhost:8080"
```

Alternatively you can create the release with `make release` and run it as
`rel/serverboards/bin/serverboards foreground`.

## First time user

The easiest way to have a first time user is to use

```shell
export SERVERBOARDS_DATABASE_URL="postgresl://serverboards:serverboards@localhost/serverboards"
cli/s10s-user.py create username
cli/s10s-user.py passwd username password
```

## Plugin development workflow

To develop new plugins create a directory or link to your source at
$SERVERBOARDS_PATH/plugins, which by default is on installed systems at
`/opt/serverboards/share/serverboards/plugins/`. If you use the development
version, it would be at `~/.local/serverboards/plugins/`.

Plugin manifest is normally reloaded automatically upon changes, and commands at
command restart. If it is necessary to force a command execution, you can
restart full Serverboards (`sudo service serverboards restart` or restart
backend process).
