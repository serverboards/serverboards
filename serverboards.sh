#!/bin/sh

case "$1" in
  start)
    cd backend
    MIX_ENV=prod mix compile.app mom
    MIX_ENV=prod mix compile.app serverboards
    MIX_ENV=prod mix run --no-halt
  ;;
  stop)
    echo "Not yet"
  ;;
  *)
    echo "start|stop"
esac
