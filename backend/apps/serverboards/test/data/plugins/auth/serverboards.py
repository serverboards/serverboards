import json, os, sys

try:
    input=raw_input
except:
    pass

class RPC:
    """
    Manages all the RPC status and calls.
    """
    def __init__(self, stdin, stdout):
        self.rpc_registry={}
        self.stdin=stdin
        self.stdout=stdout
        self.stderr=None
        self.loop_status='OUT'
        self.requestq=[]
        self.send_id=1
        self.pid=os.getpid()
        self.manual_replies=set()

    def set_debug(self, debug):
        self.stderr=debug
        self.debug("--- BEGIN ---")

    def debug(self, x):
        if not self.stderr:
            return
        if type(x) not in (str, unicode):
            x=repr(x)
        self.stderr.write("%d: %s\r\n"%(self.pid, x))
        self.stderr.flush()

    def add_method(self, name, f):
        self.rpc_registry[name]=f

    def call_local(self, rpc):
        f=self.rpc_registry.get(rpc['method'])
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
    def loop(self):
        prev_status=self.loop_status
        self.loop_status='IN'

        # pending requests
        while self.requestq:
            rpc = self.requestq[0]
            self.requestq=self.requestq[1:]
            self.__process_request(rpc)

        # incoming
        while self.loop_status=='IN':
            l=self.stdin.readline()
            if not l:
                self.loop_stop()
                continue
            self.debug(l)
            rpc = json.loads(l)
            self.__process_request(rpc)
        self.loop_status=prev_status

    def loop_stop(self):
        self.debug("--- EOF ---")
        self.loop_status='EXIT'

    def __process_request(self, rpc):
        self.last_rpc_id=rpc.get("id")
        res=self.call_local(rpc)
        if res.get("id") not in self.manual_replies:
            try:
                self.println(json.dumps(res))
            except:
                import traceback; traceback.print_exc()
                sys.stderr.write(repr(res)+'\n')
                self.println(json.dumps({"error": "serializing json response", "id": res["id"]}))
        else:
            self.manual_replies.discard(res.get("id"))

    def println(self, line):
        self.debug(line)
        try:
            self.stdout.write(line + '\n')
            self.stdout.flush()
        except IOError:
            self.debug("Error on PIPE error.")
            sys.exit(1)

    def log(self, message=None, type="LOG"):
        assert message
        self.event("log", type=type, message=message)

    def event(self, method, *params, **kparams):
        """
        Sends an event to the other side
        """
        rpc = json.dumps(dict(method=method, params=params or kparams))
        self.println(rpc)

    def reply(self, result):
        """
        Shortcuts request processing returning an inmediate answer. The final
        answer will be ignored.

        This allows to start long running processes that may send events in a
        loop.

        If more calls are expected, it is recomended to spawn new threads.
        """
        self.manual_replies.add(self.last_rpc_id)
        self.println(json.dumps({"id": self.last_rpc_id, "result": result}))

    def call(self, method, *params, **kparams):
        """
        Calls a method on the other side and waits until answer.

        If receives a call while waiting for answer there are two behaviours:

        1. If at self.loop, processes the request inmediatly
        2. If not, queues it to be processed wehn loop is called

        This allows to setup the environment.
        """
        id=self.send_id
        self.send_id+=1
        rpc = json.dumps(dict(method=method, params=params or kparams, id=id))
        self.println(rpc)

        while True: # mini loop, may request calls while here
            res = sys.stdin.readline()
            if not res:
                raise Exception("Closed connection")
            rpc = json.loads(res)
            if 'id' in rpc and ('result' in rpc or 'error' in rpc):
                assert rpc['id']==id
                if 'error' in rpc:
                    raise Exception(rpc['error'])
                else:
                    return rpc['result']
            else:
                if self.loop_status=="IN":
                    self.debug("Waiting for reply; Execute now for later: %s"% res)
                    self.__process_request(rpc)
                else:
                    self.debug("Waiting for reply; Queue for later: %s"% res)
                    self.requestq.append(rpc)

rpc=RPC(sys.stdin, sys.stdout)
sys.stdout=sys.stderr # allow debugging by print

def rpc_method(f):
    """
    Decorator to add this method to the known RPC methods.

    Use as simple decorator:

    ```
    @decorator
    def func(param1, param2):
        ....
    ```

    or with a specific name

    ```
    @decorator("rpc-name")
    def func(param1=None):
        ...
    """
    if type(f)==str:
        method_name=f
        def regf(f):
            #print("Registry %s: %s"%(method_name, repr(f)))
            rpc.add_method(method_name, f)
            return f
        return regf
    else:
        #print("Registry %s"%(f.__name__))
        rpc.add_method(f.__name__,f)
    return f

@rpc_method("dir")
def __dir():
    return rpc.rpc_registry.keys()

def loop(debug=None):
    if debug:
        rpc.set_debug(debug)
    rpc.loop()

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
