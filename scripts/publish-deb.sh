#!/bin/bash

function get_version(){
	local VERSION=$( head -1 debian/changelog | grep -oh '(\([^)]*\)' | cut -b2- )
	echo $VERSION
}


rsync -avz serverboards.deb -e ssh www.serverboards.io:/downloads/

VERSION=$( get_version )
cat > latest.json << EOF
{"version": "$VERSION"}
EOF

rsync -avz serverboards.deb -e ssh www.serverboards.io:/downloads/serverboards_${VERSION}_amd64.deb
rsync -avz latest.json -e ssh www.serverboards.io:/downloads/
