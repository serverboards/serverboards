# Roadmap

## 2016-03-18 - ~~Webpage~~

* Functional https://serverboards.io, with blog, comments, subscription and so on.

## 2016-04-01 - ~~Authentication RPC~~

* Be able to enter via TCP and authenticate using email / password.
* Must set permissions.
* Pro: Various auth mechanisms using plugins.

## 2016-04-15 - ~~Basic web app, basic comm with plugins.~~

* Use react.
* Basic web app with authentication.
* Basic communication with plugins so that from webapp can execute a command
and have some communication.

## 2016-04-29 - ~~Users and groups, services and components~~

* User and group management
* Service and components management
* Basic edition

## 2016-05-17 - ~~Actions, polishing~~

* First polish round, internal clean up do missing points: permissions, some edition
* Rename service/components to serverboard/services.
* Services section
* Actions on services
* Plugins must be able to show some custom UI using React.

## 2016-06-30 - ~~Rules~~

* Triggers
* Rules

## 2016-07-14 ~SSH into remote machines~

Can perform operations using SSH on remote machines.

## 2016-07-30 - ~Manage virtual machines~

## 2016-09 - BETA RELEASE

* First version
* Core MUST have:
  - [x] Plugin comunication via RPC
  - [x] Plugin sections on UI
  - [x] Plugin settings
  - [x] Communications: inapp, email, telegram
  - [x] User management: permissions & groups
  - [ ] Easy deploy with docker
  - [ ] Recover from errors
  - [x] Simple Rules
  - [x] Serverboard Simple Widgets
* Plugins for:
  - [x] Simple virtual machine management: start, stop, list.
  - [ ] see the remote logs,
  - [x] use SSH terminal from Serverboards.
* Overall MUST be posible to
  - [ ] Monitor server (Ping/HTTP/port conn) uptime,
  - [x] notify down/up

Extras:
* Monitor webpage changes

No goals:
* Plugin store // Uninstalled plugins
