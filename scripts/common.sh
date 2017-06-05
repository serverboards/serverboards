function wait_for_port(){
  set +e
  WAIT="1"
  while [ "$WAIT" ]; do
    sleep 2
    fuser -n tcp $1
    if [ "$?" == "0" ]; then
      WAIT=""
    fi
  done
  set -e
}

function create_temporal_db(){
  local DBNAME="$1"
  local TOKEN="$2"
  psql template1 <<EOF
create database $DBNAME;
EOF
  local PREVEXIT=$( trap -p EXIT )

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
    $PREVEXIT
  }
  trap atexit EXIT
}

function create_user(){
  local SERVERBOARDS_DATABASE_URL="$1"
  local USERNAME="$2"
  local TOKEN="$3"
  # password always "asdfasdf"
  psql $SERVERBOARDS_DATABASE_URL <<EOF
INSERT INTO auth_user (email, name, is_active, inserted_at, updated_at)
  VALUES
  ('$USERNAME', 'Test User', true, NOW(), NOW());

INSERT INTO auth_user_password (user_id, password, inserted_at, updated_at)
  VALUES
  (1, '$bcrypt$$2b$12$mFXChDI63yh1WPR./gJjk.vq7U3Q/r1xjtgmLJhDhPoaZd650pAny', NOW(), NOW());

INSERT INTO auth_user_group (user_id, group_id)
  VALUES
  (1, 1),
  (1, 2);

INSERT INTO auth_user_token
  (user_id, token, perms, time_limit, inserted_at, updated_at)
  VALUES
  (1, '$TOKEN', NULL, NOW() + '30 minutes'::interval, NOW(), NOW());
EOF
}
