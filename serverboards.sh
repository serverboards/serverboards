#!/bin/sh

case "$1"
  start)
    cd backend
    mix run --no-halt
  ;;
  stop)
    echo "Not yet"
  ;;
  *)
    echo "start|stop"
esac
