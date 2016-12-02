#!/bin/sh

set -xe

# Write log to /tmp/serverboards-update.log
exec 1<&-
exec 2<&-
exec 1<>/tmp/serverboards-update.log
exec 2>&1

DURL=https://serverboards.io/downloads/
TMPDIR=$( mktemp -d )
cd $TMPDIR
VERSION=$( curl $DURL/latest.json | python3 -c "import sys, json; print(json.load(sys.stdin)['version'])" )
curl -o serverboards.deb $DURL/serverboards_${VERSION}_amd64.deb
apt-get update
dpkg -i serverboards.deb
apt-get -f install
service serverboards restart
cd
rm -rf $TMPDIR
