#!/bin/bash

. scripts/common.sh
set -e

BASEDIR=$( pwd )
# random database name
TOKEN=$( uuidgen )
DBNAME=$( pwgen -A 8 )
create_temporal_db $DBNAME

export SERVERBOARDS_PATH=$( pwd )/local/
export SERVERBOARDS_INI=test/plugins.ini
export SERVERBOARDS_DATABASE_URL="postgresql://serverboards:serverboards@localhost/$DBNAME"

pushd backend >/dev/null
mkdir -p $BASEDIR/log/
export MIX_ENV=prod
mix local.rebar --force > $BASEDIR/log/compile.log
mix local.hex --force > $BASEDIR/log/compile.log
#mix deps.clean --all > $BASEDIR/log/compile.log
mix deps.get > $BASEDIR/log/compile.log
mix compile > $BASEDIR/log/compile.log
mix run --no-halt > $BASEDIR/log/serverboards.log &
BACKEND_PID=$!
popd >/dev/null

echo "Backend at $BACKEND_PID. Waiting for port 4040 UP..."
wait_for_port 4040 $BACKEND_PID
echo "Done."
set -e

echo "Create user"
# must be after backend is on, for database to be created
create_user $SERVERBOARDS_DATABASE_URL $TOKEN

echo "Run tests"
pushd cli >/dev/null
set +e
make FINALDIR=.
./s10s plugin-test --auth-token=$TOKEN
EXITCODE=$?
set -e
popd >/dev/null

if [ "$EXITCODE" != 0 ]; then
  echo "FAILED"
else
  echo "ALL OK"
fi

exit $EXITCODE
