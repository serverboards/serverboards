#!/bin/sh
cd $( dirname $0 )
HOSTNAME=www.coralbits.com
scp -r . $HOSTNAME:/tmp/terminalsql
ssh $HOSTNAME /tmp/terminalsql/serverboards-sql.py
