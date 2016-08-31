#!/bin/sh

cd $( dirname $0 )

export MIX_ENV=prod
# PAth where serverboards is installed. If not env set, use $HOME/serverboards
export SERVERBOARDS_PATH=${SERVERBOARDS_PATH:-${HOME}/.serverboards/}
# Default database setup, user, password and database are serverboards
export SERVERBOARDS_DB=${SERVERBOARDS_DB:-postgres://serverboards:serverboards@localhost/serverboards}
export LD_LIBRARY_PATH=$( dirname $0 )/lib

# Setups the environment on first run. Connects to the database and creates all
setup(){
  mkdir -p ${SERVERBOARDS_PATH}
  mkdir -p ${SERVERBOARDS_PATH}/plugins/

  echo "export SERVERBOARDS_DB=${SERVERBOARDS_DB}" > ${SERVERBOARDS_PATH}/setup-env.sh

  postgres_wait
  bin/serverboards command Elixir.Serverboards.Setup initial "[ password: \"$(hostname)\" ]"

  echo
  echo "Serverboards is setup at ${SERVERBOARDS_PATH}"
  echo "Remember that your default username / password is admin@serverboards.io / $(hostname)"
  echo
}

postgres_setup(){
  chmod 0700 /var/lib/postgresql/9.5/main/
  chown postgres:postgres /var/lib/postgresql/9.5/main/

  su postgres -c "/usr/lib/postgresql/9.5/bin/initdb /var/lib/postgresql/9.5/main/"
  su postgres -c "/usr/lib/postgresql/9.5/bin/pg_ctl -D /var/lib/postgresql/9.5/main/ start"
  sleep 1

  su postgres -c "psql --command \"CREATE USER serverboards WITH SUPERUSER PASSWORD 'serverboards';\""
  su postgres -c "createdb -O serverboards serverboards"

  cat share/serverboards/backend/initial.sql | psql $SERVERBOARDS_DB

  su postgres -c "/usr/lib/postgresql/9.5/bin/pg_ctl -D /var/lib/postgresql/9.5/main/ stop"
}

postgres_start(){
  [ -e " /var/run/postgresql/9.5-main.pg_stat_tmp/" ] || (
    mkdir /var/run/postgresql/9.5-main.pg_stat_tmp/ &&
    chown postgres:postgres /var/run/postgresql/9.5-main.pg_stat_tmp/
    )
  [ -e "/var/lib/postgresql/9.5/main/PG_VERSION" ] || postgres_setup
  exec su postgres -c "/usr/lib/postgresql/9.5/bin/postgres --config_file=/etc/postgresql/9.5/main/postgresql.conf"
}

postgres_wait(){
  local cont="1"
  while [ "$cont" = "0" ]; do
    echo "select * from action_history;" | psql $SERVERBOARDS_DB
    cont = "$?"
    if [ "$cont" = "1" ]; then
      sleep 4
    fi
  done
}

main(){
  if [ ! -e "${SERVERBOARDS_PATH}/setup-env.sh" ]; then
    setup
  fi
  . ${SERVERBOARDS_PATH}/setup-env.sh

  case "$1" in
    start)
      postgres_wait
      exec bin/serverboards foreground
      ;;
      postgres-start)
        postgres_start
      ;;
      postgres-setup)
        postgres_setup
      ;;
    stop)
      exec bin/serverboards stop
    ;;
    *)
      echo "start|stop"
    ;;
  esac
}

main $*
