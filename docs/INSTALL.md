# Installation

## Database creation

Serverboards get the initial database setup from `database.url` config
variable.

It can be set as an environmental variable (`SERVERBOARDS_DATABASE_URL`) or at
`/etc/serverboards.ini`.

First the database has to exist and provide access to the user:

```bash
$ su postgres
$ psql
CREATE DATABASE serverboards WITH ENCODING 'utf8';
CREATE USER serverboards WITH PASSWORD 'serverboards';
GRANT ALL ON DATABASE serverboards TO serverboards;
\q
```

## Run

And run it:

```bash
$ /opt/serverboards/bin/serverboards foreground
```

If `database.url` does not exist, it uses `ecto://serverboards:serverboards@localhost/serverboards`
as default value.

On first run generates the required directories and database tables. It uses
`SERVERBOARDS_PATH` as path to use for current installation. This directory must
be in a non ephemeral storage.

Default configuration allows users on the PAM service `serverboards` which will allow any user on
the current system to log in by default. Users on `admin` group will be granted admin priviledges.

## Configuration

Check `/etc/serverboards.ini` and `${SERVERBOARDS_PATH}/serverboards.ini` for information on
all configuration options.

Any value in that file can be used in an environmental variable `SERVERBOARDS_section_key`, for
example to enable the TCP listening for the CLI, use:

```bash
$ export SERVERBOARDS_TCP_PORT=4040
```

## Debian packages

Serverboards is provided via debian packages (https://serverboards.io/download/deb/).
When using this package, please ensure you execute serverboards as `serverboards`
user, for example with `sudo -u serverboards /opt/serverboards/bin/serverboards
foreground`. Systemd service file is provided.

Check the README.Debian file for more instrucions.
