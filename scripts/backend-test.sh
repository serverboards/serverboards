#!/bin/bash

. scripts/common.sh

set -ex

BASEDIR=$( pwd )
mkdir -p log
touch log/databases

if [ "$1" ]; then
  export SERVERBOARDS_PATH=$( pwd )/local/
  DBNAME=$( pwgen -A 8 )
  export SERVERBOARDS_DATABASE_URL="postgresql://serverboards:serverboards@localhost/$DBNAME"
  create_database
  LOGFILE=$( pwd )/log/$(basename $2 ).log
  pushd $1 > /dev/null
  MIX_ENV=test mix run priv/repo/test_seeds.exs 2&>1 > $LOGFILE
  mix test $2 2&>1 >> $LOGFILE
  popd > /dev/null
else
  mkdir -p log
  pushd backend/ > /dev/null
  export MIX_ENV=test
  echo "Compiling..."
  set +e
  mix local.rebar --force > $BASEDIR/log/compile.log
  mix local.hex --force > $BASEDIR/log/compile.log
  #mix deps.clean --all > $BASEDIR/log/compile.log
  mix deps.get > $BASEDIR/log/compile.log
  mix compile > $BASEDIR/log/compile.log
  echo "Done"
  popd > /dev/null

  pushd backend/apps/serverboards/ > /dev/null
  TESTS=$( ls test/*_test.exs )
  popd > /dev/null
  echo "Running $( echo $TESTS | wc -w ) tests..."
  parallel -k --joblog=$BASEDIR/log/backend-tests-results.tsv $0 backend/apps/serverboards/ {1} {2} ::: $TESTS
  echo "Done"
  set -e
  cat $BASEDIR/log/backend-tests-results.tsv
  FAILURES=0
  tail log/backend-tests-results.tsv -n +2 | cut -f 7,9 | while read exitc testname; do
    if [ "$exitc" != "0" ]; then
      echo "FAIL AT $testname"
      FAILURES=$(( $FAILURES + 1 ))
    fi
  done

  if [ "$FAILURES" == "0" ]; then
    echo "SUCCESS"
  else
    echo "FAIL"
  fi
  set +e
  for i in $( cat log/databases ); do
    dropdb $i 2>/dev/null
  done

  exit $FAILURES
fi
