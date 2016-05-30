import json, os, sys

try:
    input=raw_input
except:
    pass

rpc_registry={}

def rpc_method(f):
    if type(f)==str:
        method_name=f
        def regf(f):
            #print("Registry %s: %s"%(method_name, repr(f)))
            rpc_registry[method_name]=f
            return f
        return regf
    else:
        #print("Registry %s"%(f.__name__))
        rpc_registry[f.__name__]=f
    return f

def call_local(rpc):
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
        except Exception as e:
            import traceback; traceback.print_exc()
            return {
                'error': str(e),
                'id' : rpc['id']
            }

@rpc_method("dir")
def __dir():
    return rpc_registry.keys()

def loop(debug=None):
    if debug:
        import os
        pid="%d: "%os.getpid()
        __debug=lambda x: debug.write(pid+x.strip()+'\n')
    else:
        __debug=lambda x: None
    __debug("--- BEGIN ---")
    while True:
        l=sys.stdin.readline()
        if not l:
            __debug("--- EOF ---")
            return
        __debug(l)
        rpc = json.loads(l)
        res=call_local(rpc)
        try:
            __debug(json.dumps(res))
            print(json.dumps(res))
            sys.stdout.flush()
        except:
            import traceback; traceback.print_exc()
            sys.stderr.write(repr(res)+'\n')
            print(json.dumps({"error": "serializing json response", "id": res["id"]}))
            sys.stdout.flush()



class Config:
    def __init__(self):
        self.path=os.path.expanduser( os.environ.get('SERVERBOARDS_PATH','~/.local/serverboards/') )
        Config.__ensure_path_exists(self.path)

    def file(self, filename):
        p=os.path.join(self.path, filename)
        if not p.startswith(self.path):
            raise Exception("Trying to escape from config directory.")
        Config.__ensure_path_exists(os.path.dirname(p))
        return p

    @staticmethod
    def __ensure_path_exists(path):
        try:
            os.makedirs(path, 0700)
        except OSError as e:
            if 'File exists' not in str(e):
                raise

config=Config()
