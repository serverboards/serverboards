#!/usr/bin/env python

import sys, json, os

def run_ls(path='.'):
    return os.listdir(path)

def run_line(s):
    msg=json.loads(s)
    if msg['method'] == 'ls':
        result=run_ls(msg['params'][0])
    else:
        result=None

    if result:
        res=json.dumps(dict(
            id=msg['id'],
            result=result
            ))
    else:
        res=json.dumps(dict(
            id=msg['id'],
            error="unknown method"
            ))
    print res

if __name__=='__main__':
    for l in sys.stdin.readlines():
        run_line(l.strip())
