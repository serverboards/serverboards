#!/bin/bash

if [ ! "$1" ]; then
  echo "Usage: s10s backup <backupfile.tgz>"
  exit 1
fi
if [ "$1" = "--one-line-help" ]; then
  echo "Backup Serverboards local files and database"
  exit 1
fi
OUTFILE=$1

RTMPDIR=$( mktemp -d )
set -e

[ "$RTMPDIR" ] || exit 1
TMPDIR=$RTMPDIR/serverboards/

function cleanup(){
  rm -rf ${RTMPDIR}
}
function get_config(){
  awk -F= /$1/' {print $2}' $INI_FILE | tr -d ' '  | sed -e 's/^"//' -e 's/"$//'
}
function log(){
  >&2 echo $*
}

trap cleanup EXIT

INI_FILE=/etc/serverboards.ini
if [ ! -e "$INI_FILE" ]; then
  INI_FILE=$HOME/.local/serverboards/serverboards.ini
fi
home=$( get_config home )
if [ ! -e "$home" ]; then
  home=$HOME/.local/serverboards/
fi
dburl=$( get_config url )
if [ "$( echo $dburl | grep PASSWD )" ]; then # not real dburl, try another INI file at default home
  INI_FILE=$home/serverboards.ini
  dburl=$( get_config url )
fi



log "Backup home data $home..."
mkdir -p $TMPDIR/data/
cp -a $home $TMPDIR/data/

log "Backup database..."
pg_dump "$dburl" -Fc > $TMPDIR/serverboards.sql

log "Backup configuration..."
cp $INI_FILE $TMPDIR

log "Creating backup file..."
cd $TMPDIR/..
if [ "$OUTFILE" = "-" ]; then
  tar cz serverboards | pv
  log Done
else
  tar cfz $OUTFILE serverboards
  log "$( du -h $OUTFILE )"
fi
