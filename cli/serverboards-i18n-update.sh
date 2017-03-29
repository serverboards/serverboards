#!/bin/bash

set -e

if [ ! "$1" ]; then
  echo "Update Serverboard translations."
  echo
  echo "$0 <pofile> <path*>"
  echo
  echo "It will look for JS, HTML and YAML files for text translatable in Serverboards"
  echo "example: $0 lang/es.po ."
  echo
  exit 1
fi

BASEDIR=$(dirname $0)

OUTFILE=$1
shift 1

GTFILES=""
YAMLFILES=""
set +e
for d in $*; do
  GTFILES="$GTFILES $( find $d -name "*.js" -o -name "*.html" | grep -Ev "(test|min|node_modules|^\.|^__)" )"
  YAMLFILES="$YAMLFILES $( find $d -name "*.yaml" | grep -Ev "(test|min|node_modules|^\.|^__)" )"
done
set -e

touch $OUTFILE

if [ "$GTFILES" ]; then
  xgettext --language=C -o ${OUTFILE} --force-po --keyword=i18n_nop --keyword=i18n_c:1c,2 --keyword=i18n --join-existing ${GTFILES}
fi

if [ "$YAMLFILES" ]; then
  ${BASEDIR}/serverboards-i18n-update--extract-manifest-yaml-po.py ${YAMLFILES} | msgcat ${OUTFILE} - --use-first -o ${OUTFILE}
fi

exit 0
