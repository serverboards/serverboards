#!/bin/bash


rsync -avz serverboards.deb -e ssh www.serverboards.io:/downloads/

VERSION=$( dpkg-deb --info serverboards.deb | grep Version | awk '{ print $2 }' )
echo "Current version is $VERSION"

cat > latest.json << EOF
{"version": "$VERSION"}
EOF

rsync -avz serverboards.deb -e ssh www.serverboards.io:/downloads/serverboards_${VERSION}_amd64.deb
rsync -avz latest.json -e ssh www.serverboards.io:/downloads/
