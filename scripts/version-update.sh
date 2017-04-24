#!/bin/bash

set -ex

cd "$( dirname $0 )/.."

function get_version(){
	local VERSION=$( git describe --match "v[0-9]*" --tags --abbrev=5 HEAD 2>/dev/null | cut -b2- | sed "s/-\(.*\)-/.\\1-/g" ) 
	[ "$VERSION" ] || get_prev_version
	echo $VERSION
}

function get_prev_version(){
	PREV_VERSION=$( head -1 debian/changelog | grep -oh '(\([^)]*\)' | cut -b2- )
	echo $PREV_VERSION
}

function update_version_backend(){
	sed -i 's/version: ".*"/version: "'$1'"/g' backend/mix.exs
	sed -i 's/version: ".*"/version: "'$1'"/g' backend/apps/serverboards/mix.exs
}

function update_version_frontend(){
	sed -i 's/"version": ".*"/"version": "'$1'"/g' frontend/package.json
}

function update_version_debian(){
	if [ ! "$( grep "$2" debian/changelog )" ]; then
		cat - debian/changelog > debian/changelog.bak <<EOF
serverboards ($2) unstable; urgency=medium

$( git log --pretty=format:'  * %s' --abbrev-commit v$1..HEAD  | grep -v WIP | grep -v Merge )

 -- $( git config --get user.name ) <$( git config --get user.email )>  $( date -R )

EOF
		mv debian/changelog.bak debian/changelog
	fi
}


function update_versions(){
	local VERSION=$( get_version )
	local PREV_VERSION=$( get_prev_version )
	if [ "$PREV_VERSION" == "$VERSION" ]; then
		echo "Nothing to update"
	else
		update_version_backend $( echo $VERSION | sed "s/rc/.0+rc/g" )
		update_version_frontend $( echo $VERSION | sed "s/rc/.0+rc/g" )
		update_version_debian $PREV_VERSION $( echo $VERSION | sed "s/rc/~rc/g" )
		echo "Updated version: $PREV_VERSION -> $VERSION"
	fi
}

update_versions
