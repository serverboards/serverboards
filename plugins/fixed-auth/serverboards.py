import json

try:
    input=raw_input
except:
    pass

rpc_registry={}

def rpc_method(f):
    if type(f)==str:
        method_name=f
        def regf(f):
            print("Registry %s: %s"%(method_name, repr(f)))
            rpc_registry[method_name]=f
            return f
        return regf
    else:
        print("Registry %s"%(f.__name__))
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

@rpc_method("dir")
def __dir():
    return rpc_registry.keys()

def loop():
    while True:
        try:
            l=input()
        except EOFError:
            return
        rpc = json.loads(l)
        if rpc['method'] in rpc_registry:
            res=call(rpc)
            print(json.dumps(res))
        else:
            print("***ERROR, no method: %s"%(str(__dir())))
