#!/bin/sh

set -xe

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
drop database $DBNAME;
EOF
}
trap atexit EXIT

export SERVERBOARDS_DATABASE_URL="postgresql://serverboards:serverboards@localhost/$DBNAME"

pushd backend
mix run --no-halt &
BACKEND_PID=$!
popd

echo "Backend at $BACKEND_PID"
sleep 10

psql $SERVERBOARDS_DATABASE_URL <<EOF
SELECT * FROM auth_user;
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
./s10s plugin-test --auth-token=$TOKEN
EXITCODE=$?
set -e


if [ "$EXITCODE" != 0 ]; then
  echo "FAILED"
else
  echo "ALL OK"
fi

exit $EXITCODE
