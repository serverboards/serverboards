#!/bin/sh

set -e

cd "$( dirname $0 )/.."

function get_version(){
	local VERSION=$( git describe --match "v[0-9]*" --tags --abbrev=5 HEAD 2>/dev/null | cut -b2- )
	[ "$VERSION" ] || (echo "Cant guess version."; exit 1)
	echo $VERSION
}

function update_version_backend(){
	sed -i 's/version: "[^"]"/version: "'$1'"/g' backend/mix.exs
}

function update_version_frontend(){
	sed -i 's/"version": "[^"]"/"version": "'$1'"/g' frontend/package.json
}

function update_version_debian(){
	if [ ! "$( grep "$1" debian/changelog ) " ]; then
		PREV_VERSION=$( head -1 debian/changelog | grep -oh '(\([^)]*\)' | cut -b2- )
		cat - debian/changelog > debian/changelog.bak <<EOF
serverboards ($1) unstable; urgency=medium

$( git log --pretty=format:' * %s' --abbrev-commit v$PREV_VERSION..HEAD )

  -- $( git config --get user.name ) <$( git config --get user.email )>  $( date -R )

EOF
	fi
}


function update_versions(){
	local VERSION=$( get_version )
	update_version_backend $VERSION
	update_version_frontend $VERSION
	update_version_debian $VERSION
	echo "Updated to version $VERSION"
}

update_versions
