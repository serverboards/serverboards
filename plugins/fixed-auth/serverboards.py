import json

try:
    input=raw_input
except:
    pass

rpc_registry={}

def rpc_method(f):
    rpc_registry[f.__name__]=f
    return f

def call(rpc):
    f=rpc_registry.get(rpc['method'])
    if f:
        params=rpc['params']
        if type(params)==dict:
            res=f(**params)
        else:
            res=f(*params)
        return {
            'result' : res,
            'id' : rpc['id']
            }


def loop():
    while True:
        l=input()
        rpc = json.loads(l)
        if 'method' in rpc_registry:
            res=call(rpc)
            print(json.dumps(res))
        else:
            print("***ERROR***")
