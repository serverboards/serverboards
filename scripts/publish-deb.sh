#!/bin/sh

function get_version(){
	local VERSION=$( git describe --match "v[0-9]*" --tags --abbrev=5 HEAD 2>/dev/null | cut -b2- | sed "s/.0-\(.*\)-/.\\1-/g" )
	[ "$VERSION" ] || get_prev_version
	echo $VERSION
}


rsync -avz serverboards.deb -e ssh www.serverboards.io:/downloads/

VERSION=$( get_version )
cat > latest.json << EOF
{"version": "$VERSION"}
EOF

rsync -avz serverboards.deb -e ssh www.serverboards.io:/downloads/serverboards_${VERSION}_amd64.deb
rsync -avz latest.json -e ssh www.serverboards.io:/downloads/
