#!/bin/sh

echo "Checking environment..."
export
echo "----"
if [ -e "/tmp/serverboards-test-fail-postinst" ]; then
  echo "Fail!"
  exit 1
fi

echo "All OK"
exit 0
