#!/bin/bash

REMOTE=www.serverboards.io:/ubuntu/
REPOPATH=/var/repositories/
DEBFILE=${2:-serverboards.deb}

set -e

if [ ! -e "$DEBFILE" ]; then
  echo "Need $DEBFILE in the current directory,or second argument"
  exit 1
fi

case "$1" in
  "unstable")
    rm -f "$REPOPATH/dists/unstable/main/binary-amd64/Release.gpg"

    # configured as explained at https://www.digitalocean.com/community/tutorials/how-to-use-reprepro-for-a-secure-package-repository-on-ubuntu-14-04

    reprepro -b $REPOPATH includedeb unstable $DEBFILE
    if [ ! -e "$REPOPATH/dists/unstable/Release.gpg" ]; then
            echo "No GPG signed. Aborting upload"
            exit 1
    fi

    rsync -avz -e ssh $REPOPATH/pool $REPOPATH/dists $REMOTE
    ;;
  "clean")
    rm -rf $REPOPATH/db $REPOPATH/dists $REPOPATH/pool
    ;;
  "stable")
    # stable quick, from UI, not apt installed. DEPRECATED
    rsync -avz $DEBFILE -e ssh www.serverboards.io:/downloads/

    VERSION=$( dpkg-deb --info $DEBFILE | grep Version | awk '{ print $2 }' )
    echo "Current version is $VERSION"

    cat > latest.json << EOF
{"version": "$VERSION"}
EOF
    rsync -avz $DEBFILE -e ssh www.serverboards.io:/downloads/serverboards_${VERSION}_amd64.deb
    rsync -avz latest.json -e ssh www.serverboards.io:/downloads/


    # Stable APT
    rm -f "$REPOPATH/dists/stable/main/binary-amd64/Release.gpg"

    # configured as explained at https://www.digitalocean.com/community/tutorials/how-to-use-reprepro-for-a-secure-package-repository-on-ubuntu-14-04

    reprepro -b $REPOPATH includedeb stable $DEBFILE
    if [ ! -e "$REPOPATH/dists/stable/Release.gpg" ]; then
            echo "No GPG signed. Aborting upload"
            exit 1
    fi

    rsync -avz -e ssh $REPOPATH/pool $REPOPATH/dists $REMOTE
    ;;
  ""|"help")
    echo "$0 ''|unstable|stable|clean <debfile>"
    echo
    echo " ''|unstable -- Releases to the unstable channel"
    echo " stable -- Releases to the stable channel"
    echo " clean  -- Cleans the local repositories"
    echo
esac
