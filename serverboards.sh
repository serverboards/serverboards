#!/bin/sh

cd $( dirname $0 )

export MIX_ENV=prod
# PAth where serverboards is installed. If not env set, use $HOME/serverboards
export SERVERBOARDS_PATH=${SERVERBOARDS_PATH:-${HOME}/.serverboards/}
# Default database setup, user, password and database are serverboards
export SERVERBOARDS_DB=${SERVERBOARDS_DB:-postgres://serverboards:serverboards@localhost/serverboards}

# Setups the environment on first run. Connects to the database and creates all
# does not exist. Sets up intial directory.
setup(){
  mkdir -p ${SERVERBOARDS_PATH}
  mkdir -p ${SERVERBOARDS_PATH}/plugins/

  echo "export SERVERBOARDS_DB=${SERVERBOARDS_DB}" > ${SERVERBOARDS_PATH}/setup-env.sh

  cd backend
  mix ecto.migrate -r Serverboards.Repo
  mix run apps/serverboards/priv/repo/seed.exs
  cd ..

  echo
  echo "Serverboards is setup at ${SERVERBOARDS_PATH}"
  echo "Remember your username / password is admin@serverboards.io / $(hostname)"
  echo
}

postgresql_setup(){
  chmod 0700 /var/lib/postgresql/9.5/main/
  chown postgres:postgres /var/lib/postgresql/9.5/main/

  su postgres -c "/usr/lib/postgresql/9.5/bin/initdb /var/lib/postgresql/9.5/main/"
  su postgres -c "/usr/lib/postgresql/9.5/bin/pg_ctl -D /var/lib/postgresql/9.5/main/ start"
  sleep 1

  su postgres -c "psql --command \"CREATE USER serverboards WITH SUPERUSER PASSWORD 'serverboards';\""
  su postgres -c "createdb -O serverboards serverboards"

  su postgres -c "/usr/lib/postgresql/9.5/bin/pg_ctl -D /var/lib/postgresql/9.5/main/ stop"
}

main(){
  [ -e "${SERVERBOARDS_PATH}/setup-env.sh" ] && . ${SERVERBOARDS_PATH}/setup-env.sh

  case "$1" in
    start)
      [ -e "${SERVERBOARDS_PATH}/setup-env.sh" ] || setup

      cd backend
      mix deps.get
      mix deps.compile
      mix ecto.migrate -r Serverboards.Repo
      exec mix run --no-halt
      ;;
    postgresql-start)
      [ -e " /var/run/postgresql/9.5-main.pg_stat_tmp/" ] || (
        mkdir /var/run/postgresql/9.5-main.pg_stat_tmp/ &&
        chown postgres:postgres /var/run/postgresql/9.5-main.pg_stat_tmp/
        )
      [ -e "/var/lib/postgresql/9.5/main/PG_VERSION" ] || postgresql_setup
      exec su postgres -c "/usr/lib/postgresql/9.5/bin/postgres --config_file=/etc/postgresql/9.5/main/postgresql.conf"
    ;;
    serverboards-start)
      chown -R serverboards:serverboards ${SERVERBOARDS_PATH}
      chown -R serverboards:serverboards $( dirname $0 )

      su serverboards -c "$0 start"
      ;;
    stop)
      echo "Not yet"
    ;;
    test)
      make -j2 -m test
    ;;
    *)
      echo "start|stop"
    ;;
  esac
}

main $*
