# Installation

## Database creation

Serverboards get the initial database setup from `SERVERBOARDS_DB` environment
variable.

First the datbase has to exist and provide access to the user:

```bash
$ su postgres
$ psql
CREATE DATABASE serverboards WITH ENCODING 'utf8';
CREATE USER serverboards WITH PASSWORD 'serverboards';
GRANT ALL ON DATABASE serverboards TO serverboards;
\q
```

It needs the environment variable:

```
$ export SERVERBOARDS_DB=ecto://serverboards:serverboards@localhost/serverboards
```

## First run to setup environment

And run it:

```
./serverboards.sh start
```

If `SERVERBOARDS_DB` does not exist, it uses `ecto://serverboards:serverboards@localhost/serverboards`
as default value.

On first run generates the required directories and database tables. It uses
`SERVERBOARDS_PATH` as path to use for current installation. This directory must
be in a non ephemeral storage.

## Known Environmental variables

* `SERVERBOARDS_PATH` -- Path where to install/is installed serverboards installation data.
  Default is ~/.serverboards/
* `SERVERBOARDS_DB` -- Database URL: `ecto://USERNAME:PASSWORD@HOSTNAME/DATABASE`
