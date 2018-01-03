#!/bin/bash

set -ex

VERSIONBASE="18.1.0-"
BASEREVISION="a65aa0fc62500961675278fb96ad9d61f85c28af"
NPATCHES=$( git rev-list --count $BASEREVISION...HEAD )
AUTHOR="$( git config --get user.name ) <$( git config --get user.email )>"

# it will build $VERSIONBASE.$NPATCHES,
# it may use a full semver with .$NPATCHES for alpha and beta versions too

cd "$( dirname $0 )/.."

function get_version(){
	local VERSION=$VERSIONBASE$NPATCHES
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
	if [ ! "$( grep "$1" debian/changelog )" ]; then
		cat - debian/changelog > debian/changelog.bak <<EOF
serverboards ($1) unstable; urgency=medium

$( git log --pretty=format:'  * %s' --abbrev-commit $BASEREVISION..HEAD  | grep -v WIP | grep -v Merge )

 -- $AUTHOR  $( date -R )

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
		update_version_backend $( echo $VERSION | sed "s/~/-/g" )
		update_version_frontend $( echo $VERSION | sed "s/~/+/g" )
		update_version_debian $VERSION
		echo "Updated version: $PREV_VERSION -> $VERSION"
	fi
}

update_versions
