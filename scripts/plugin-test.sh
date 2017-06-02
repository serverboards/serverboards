#!/bin/bash

set -e

BASEDIR=$( pwd )
# random database name
TOKEN=$( uuidgen )
DBNAME=$( pwgen -A 8 )
psql template1 <<EOF
create database $DBNAME;
EOF

atexit(){
  set +e
  [ "$BACKEND_PID" ] && kill $BACKEND_PID
  sleep 1
  [ "$BACKEND_PID" ] && kill -9 $BACKEND_PID
  sleep 1
  psql template1 <<EOF
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '$DBNAME';

drop database $DBNAME;
EOF
}
trap atexit EXIT

export SERVERBOARDS_INI=test/plugins.ini
export SERVERBOARDS_DATABASE_URL="postgresql://serverboards:serverboards@localhost/$DBNAME"

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

echo "Backend at $BACKEND_PID. Waiting for port 4040 UP..."

sleep 10

set +e
WAIT="1"
while [ "$WAIT" ]; do
  sleep 2
  fuser -n tcp 4040
  if [ "$?" == "0" ]; then
    WAIT=""
  fi
done
echo "Done."
set -e

psql $SERVERBOARDS_DATABASE_URL <<EOF
INSERT INTO auth_user (email, name, is_active, inserted_at, updated_at)
  VALUES
  ('test@serverboards.io', 'Test User', true, NOW(), NOW());

INSERT INTO auth_user_group (user_id, group_id)
  VALUES
  (1, 1),
  (1, 2);

INSERT INTO auth_user_token
  (user_id, token, perms, time_limit, inserted_at, updated_at)
  VALUES
  (1, '$TOKEN', NULL, NOW() + '30 minutes'::interval, NOW(), NOW());
EOF

echo "Run tests"
pushd cli
set +e
make FINALDIR=.
./s10s plugin-test --auth-token=$TOKEN
EXITCODE=$?
set -e


if [ "$EXITCODE" != 0 ]; then
  echo "FAILED"
else
  echo "ALL OK"
fi

exit $EXITCODE
