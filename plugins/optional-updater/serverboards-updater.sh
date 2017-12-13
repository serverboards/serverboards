#!/bin/sh

set -x

export DEBIAN_FRONTEND=noninteractive

dpkg --configure -a

if [ -e "/etc/apt/sources.list.d/serverboards.list" ]; then
  # Easy apt update
  apt-get update
  apt-get install serverboards -o Dpkg::Options::="--force-confold"
  # Restart serverboards. Will make current serverboards fail and even this script to exit.
  service serverboards restart &
  exit 0
else
  dpkg --configure -a
  apt-get -fy install
  DURL=https://serverboards.io/downloads/
  TMPDIR=$( mktemp -d )
  cd $TMPDIR
  VERSION=$( curl $DURL/latest.json | python3 -c "import sys, json; print(json.load(sys.stdin)['version'])" )
  curl -o serverboards.deb $DURL/serverboards_${VERSION}_amd64.deb
  apt-get update
  dpkg --force-confold -i serverboards.deb
  apt-get -f install
  service serverboards restart
  cd
  rm -rf $TMPDIR
fi
