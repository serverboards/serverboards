#!/usr/bin/python
import json, sys

try:
    input=raw_input
except:
    pass

rpc_registry={}

def rpc_method(f):
    if type(f)==str:
        method_name=f
        def regf(f):
            rpc_registry[method_name]=f
            return f
        return regf
    else:
        rpc_registry[f.__name__]=f
    return f

def call(rpc):
    f=rpc_registry.get(rpc['method'])
    if f:
        params=rpc['params']
        try:
            if type(params)==dict:
                res=f(**params)
            else:
                res=f(*params)
            return {
                'result' : res,
                'id' : rpc['id']
                }
        except e:
            return {'error':'exception: '+str(e),'id':rpc['id']}
    return {'error':'unknown_method','id':rpc['id']}

@rpc_method("dir")
def __dir():
    return rpc_registry.keys()

def loop(debug=None):
    if debug: debug.write("--- BEGIN ---\n")
    while True:
        l=sys.stdin.readline()
        if not l:
            if debug: debug.write("--- EOF ---\n")
            return
        if debug: debug.write(l)
        rpc = json.loads(l)
        res=call(rpc)
        if debug: debug.write(json.dumps(res)+'\n')
        print(json.dumps(res)+'\n')
        sys.stdout.flush()
