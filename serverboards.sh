#!/bin/sh

cd $( dirname $0 )

export MIX_ENV=prod
# PAth where serverboards is installed. If not env set, use $HOME/serverboards
export SERVERBOARDS_PATH=${SERVERBOARDS_PATH:-${HOME}/.serverboards/}
# Default database setup, user, password and database are serverboards
export SERVERBOARDS_DB=${SERVERBOARDS_DB:-ecto://serverboards:serverboards@localhost/serverboards}

# Setups the environment on first run. Connects to the database and creates all
# does not exist. Sets up intial directory.
setup(){
  mkdir -p ${SERVERBOARDS_PATH}
  mkdir -p ${SERVERBOARDS_PATH}/plugins/

  echo "export SERVERBOARDS_DB=${SERVERBOARDS_DB}" > ${SERVERBOARDS_PATH}/setup-env.sh

  (cd backend; mix ecto.migrate -r Serverboards.Repo; mix run apps/serverboards/priv/repo/seed.exs)

  echo
  echo "Serverboards is setup at ${SERVERBOARDS_PATH}"
  echo "Remember your username / password is admin@serverboards.io / $(hostname)"
  echo
}

main(){
  if [ ! -e ${SERVERBOARDS_PATH}/setup-env.sh ]; then
    setup
  fi

  . ${SERVERBOARDS_PATH}/setup-env.sh

  # do database update
  (cd backend; mix ecto.migrate -r Serverboards.Repo)

  case "$1" in
    start)
      cd backend
      mix run --no-halt
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
