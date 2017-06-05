#!/bin/bash

. scripts/common.sh
set -e

BASEDIR=$( pwd )
DBNAME=$( pwgen -A 8 )
create_temporal_db $DBNAME

export SERVERBOARDS_PATH=$( pwd )/local/
export SERVERBOARDS_INI=test/plugins.ini
export SERVERBOARDS_DATABASE_URL="postgresql://serverboards:serverboards@localhost/$DBNAME"

pushd frontend
make compile
popd

pushd backend
mkdir -p $BASEDIR/log/
export MIX_ENV=prod
mix local.rebar --force > $BASEDIR/log/compile.log
mix local.hex --force > $BASEDIR/log/compile.log
#mix deps.clean --all > $BASEDIR/log/compile.log
mix deps.get > $BASEDIR/log/compile.log
mix compile > $BASEDIR/log/compile.log
mix run --no-halt > $BASEDIR/log/serverboards.log &
BACKEND_PID=$!
popd

echo "Backend at $BACKEND_PID. Waiting for port 8080 UP..."
wait_for_port 8080
echo "Done."
set -e

# must be after backend is on, for database to be created
create_user $SERVERBOARDS_DATABASE_URL test@serverboards.io $TOKEN


pushd frontend
set +e
npm test
EXIT="$?"
set -e
popd

echo
if [ "$EXIT" == "0" ]; then
  echo "SUCCESS"
else
  echo "FAIL"
fi
echo

exit $EXIT
