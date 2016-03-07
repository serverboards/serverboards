#!/usr/bin/python -u

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
    return res

log=open("/tmp/log","w")
if __name__=='__main__':
    print '{"method":"ready", "params":[]}'
    sys.stdout.flush()
    while True:
        l=sys.stdin.readline().strip()
        if not l:
            break
        #print l
        log.write(l+'\n')
        res=run_line(l.strip())
        log.write(res+'\n')
        print res
        sys.stdout.flush()
        log.write('--\n')
