#!/bin/bash

. scripts/common.sh
set -e

case "$1" in
  "--watch")
    WATCH="--watch"
  ;;
  "--help")
    echo "$0 [--watch]"
    exit 1
  ;;
esac

BASEDIR=$( pwd )
DBNAME=$( pwgen -A 8 )
create_temporal_db $DBNAME

export SERVERBOARDS_PATH=$( pwd )/local/
export SERVERBOARDS_INI=test/plugins.ini
export SERVERBOARDS_DATABASE_URL="postgresql://serverboards:serverboards@localhost/$DBNAME"

echo "Compiling backend"
pushd backend >/dev/null
mkdir -p $BASEDIR/log/
export MIX_ENV=prod
mix local.rebar --force 2>&1 > $BASEDIR/log/compile.log
mix local.hex --force 2>&1 >> $BASEDIR/log/compile.log
#mix deps.clean --all > $BASEDIR/log/compile.log
mix deps.get 2>&1 >> $BASEDIR/log/compile.log
mix compile 2>&1 >> $BASEDIR/log/compile.log
mix run --no-halt 2>&1 > $BASEDIR/log/serverboards.log &
BACKEND_PID=$!
popd >/dev/null

echo "Backend at $BACKEND_PID. Waiting for port 8080 UP..."
wait_for_port 8080
echo "Done."
set -e

# must be after backend is on, for database to be created
create_user $SERVERBOARDS_DATABASE_URL $TOKEN

pushd frontend > /dev/null
set +e
rm -rf shots/*
mkdir -p shots

if [ "$WATCH" ]; then
  while true; do
    echo "Compiling frontend"
    make compile 2>&1 >> $BASEDIR/log/compile.log
    echo
    echo "TEST"
    echo
    npm test && node_modules/.bin/wdio wdio.conf.js
    EXIT="$?"
    sleep 2 || break
    inotifywait -e close_write -r app
  done
else
  echo "Starting Xvfb"
  Xvfb :5 &
  XVFB_PID=$!
  export DISPLAY=:5
  echo "Compiling frontend"
  make compile 2>&1 >> $BASEDIR/log/compile.log
  echo
  echo "TEST"
  echo
  npm test && node_modules/.bin/wdio wdio.conf.js
  EXIT="$?"
fi

set -e
popd >/dev/null

echo
if [ "$EXIT" == "0" ]; then
  echo "SUCCESS"
else
  echo "FAIL"
fi
echo

kill $BACKEND_PID $XVFB_PID
sleep 1
kill -9 $BACKEND_PID $XVFB_PID

exit $EXIT
