#!/bin/bash

REMOTE=www.serverboards.io:/ubuntu/
REPOPATH=/var/repositories/

set -e

if [ ! -e "serverboards.deb" ]; then
  echo "Need serverboards.deb in the current directory"
  exit 1
fi

case "$1" in
  ""|"unstable")
    rsync -avz serverboards.deb -e ssh www.serverboards.io:/downloads/

    VERSION=$( dpkg-deb --info serverboards.deb | grep Version | awk '{ print $2 }' )
    echo "Current version is $VERSION"

    cat > latest.json << EOF
{"version": "$VERSION"}
EOF
    rsync -avz serverboards.deb -e ssh www.serverboards.io:/downloads/serverboards_${VERSION}_amd64.deb
    rsync -avz latest.json -e ssh www.serverboards.io:/downloads/
    ;;
  "clean")
    rm -rf $REPOPATH/db $REPOPATH/dists $REPOPATH/pool
    ;;
  "stable")
    rm -f "$REPOPATH/dists/stable/main/binary-amd64/Release.gpg"

    # configured as explained at https://www.digitalocean.com/community/tutorials/how-to-use-reprepro-for-a-secure-package-repository-on-ubuntu-14-04

    reprepro -b $REPOPATH includedeb stable serveboards.deb
    if [ ! -e "$REPOPATH/dists/stable/Release.gpg" ]; then
            echo "No GPG signed. Aborting upload"
            exit 1
    fi

    rsync -avz -e ssh $REPOPATH/pool $REPOPATH/dists $REMOTE
    ;;
  "help")
    echo "$0 ''|unstable|stable|clean"
    echo
    echo " ''|unstable -- Releases to the unstable channel"
    echo " stable -- Releases to the stable channel"
    echo " clean  -- Cleans the local repositories"
    echo
esac
