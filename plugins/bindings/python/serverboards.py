import json, os, sys, select, time

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
        self.events={}
        self.timers={} # timer_id -> (next_stop, id, seconds, continuation)
        self.timer_id=1
        self.add_event(sys.stdin, self.read_parse_line)
        self.subscriptions={}
        self.subscriptions_ids={}
        self.subscription_id=1

        class WriteToLog:
          def __init__(self, rpc):
            self.rpc=rpc
          def write(self, txt, *args, **kwargs):
            self.rpc.error(txt.rstrip())

        self.write_to_log=WriteToLog(self)

    def set_debug(self, debug):
        if debug is True:
            self.stderr=sys.stderr
        else:
            self.stderr=debug
        self.debug("--- BEGIN ---")

    def __decorate_log(self, extra, level=2):
        import inspect
        callerf=inspect.stack()[level]

        caller={
          "function":callerf[3],
          "file":callerf[1],
          "line":callerf[2],
          "pid":os.getpid(),
        }
        caller.update(extra)
        return caller

    def debug(self, msg, extra={}, level=0):
        self.debug_stdout(msg)
        return self.event("log.debug", str(msg), self.__decorate_log(extra, level=2+level))
    def info(self, msg, extra={}, level=0):
        self.debug_stdout(msg)
        return self.event("log.info", str(msg), self.__decorate_log(extra, level=2+level))
    def error(self, msg, extra={}, level=0):
        self.debug_stdout(msg)
        return self.event("log.error", str(msg), self.__decorate_log(extra, level=2+level))
    def info(self, msg, extra={}, level=0):
        self.debug_stdout(msg)
        return self.event("log.info", str(msg), self.__decorate_log(extra, level=2+level))

    def debug_stdout(self, x):
        if not self.stderr:
            return
        if type(x) != str:
            x=repr(x)
        try:
            self.stderr.write("\r%d: %s\r\n"%(self.pid, x))
            self.stderr.flush()
        except BlockingIOError:
            pass

    def add_method(self, name, f):
        self.rpc_registry[name]=f

    def call_local(self, rpc):
        method=rpc['method']
        params=rpc['params']
        call_id=rpc.get('id')
        (args,kwargs) = ([],params) if type(params)==dict else (params, {})

        if method in self.rpc_registry:
            f=self.rpc_registry[method]
            try:
                res=f(*args, **kwargs)
                return {
                    'result' : res,
                    'id' : call_id
                    }
            except Exception as e:
                import traceback; traceback.print_exc(file=self.write_to_log)
                return {
                    'error': str(e),
                    'id' : call_id
                }
        self.debug("Check subscriptions %s in %s"%(method, repr(self.subscriptions)))
        if method in self.subscriptions:
            assert call_id is None
            for f in self.subscriptions[method]:
                try:
                    f(*args, **kwargs)
                except:
                    import traceback; traceback.print_exc(file=self.write_to_log)
            return None

        return { 'error':'unknown_method', 'id': call_id }
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
            #self.debug("Wait fds: %s"%([x.fileno() for x in self.events.keys()]))
            if self.timers:
                next_timeout, timeout_id, timeout, timeout_cont=min(self.timers.values())
                next_timeout-=time.time()
            else:
                next_timeout, timeout_id, timeout, timeout_cont=None, None, None, None

            if not next_timeout or next_timeout>=0:
                (read_ready,_,_) = select.select(self.events.keys(),[],[], next_timeout)
            else: # maybe timeout already expired
                read_ready=[]

            #self.debug("Ready fds: %s // maybe_timer %s"%([x for x in read_ready], timeout_id))
            if read_ready:
                for ready in read_ready:
                    self.events[ready]()
            else: # timeout
                self.timers[timeout_id]=(time.time()+timeout, timeout_id, timeout, timeout_cont)
                try:
                    timeout_cont()
                except:
                    import traceback; traceback.print_exc(file=self.write_to_log)

        self.loop_status=prev_status

    def read_parse_line(self):
        l=self.stdin.readline()
        if not l:
            self.loop_stop()
            return
        self.debug_stdout(l)
        rpc = json.loads(l)
        self.__process_request(rpc)

    def add_event(self, fd, cont):
        if not fd in self.events:
            self.events[fd]=cont

    def remove_event(self, fd):
        if fd in self.events:
            del self.events[fd]

    def add_timer(self, interval, cont):
        tid=self.timer_id
        self.timer_id+=1
        next_stop=time.time()+interval
        self.timers[tid]=(next_stop, tid, interval, cont)
        return tid

    def remove_timer(self, tid):
        del self.timers[tid]

    def loop_stop(self, debug=True):
        if debug:
          self.debug("--- EOF ---")
        self.loop_status='EXIT'

    def __process_request(self, rpc):
        self.last_rpc_id=rpc.get("id")
        res=self.call_local(rpc)
        if res: # subscription do not give back response
            if res.get("id") not in self.manual_replies:
                try:
                    self.println(json.dumps(res))
                except:
                    import traceback; traceback.print_exc(file=self.write_to_log)
                    sys.stderr.write(repr(res)+'\n')
                    self.println(json.dumps({"error": "serializing json response", "id": res["id"]}))
            else:
                self.manual_replies.discard(res.get("id"))

    def println(self, line):
        self.debug_stdout(line)
        try:
          self.stdout.write(line + '\n')
          self.stdout.flush()
        except IOError:
          if self.loop_status=='EXIT':
            sys.exit(1)
          self.loop_stop(debug=False)



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
            self.debug_stdout(res)
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

    def subscribe(self, event, callback):
        eventname=event.split('[',1)[0] # maybe event[context], we keep only event as only events are sent.
        sid=self.subscription_id

        self.subscriptions[eventname]=self.subscriptions.get(eventname,[]) + [callback]
        self.subscriptions_ids[sid]=(eventname, callback)

        self.call("event.subscribe",event)
        self.subscription_id+=1

        self.debug("Subscribed to %s"%event)
        #self.debug("Added subscription %s id %s: %s"%(eventname, sid, repr(self.subscriptions[eventname])))
        return sid

    def unsubscribe(self, subscription_id):
        self.debug("%s in %s"%(subscription_id, repr(self.subscriptions_ids)))
        (event, callback) = self.subscriptions_ids[subscription_id]
        self.subscriptions[event]=[x for x in self.subscriptions[event] if x!=callback]
        self.debug("Removed subscription %s id %s"%(event, subscription_id))
        del self.subscriptions_ids[subscription_id]

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
    return list( rpc.rpc_registry.keys() )

def loop(debug=None):
    if debug:
        rpc.set_debug(debug)
    rpc.loop()

def debug(s):
    rpc.debug(s, level=1)
def info(s):
    rpc.debug(s, level=1)
def warning(s):
    rpc.debug(s, level=1)
def error(s):
    rpc.debug(s, level=1)

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
            os.makedirs(path, 0o0700)
        except OSError as e:
            if 'File exists' not in str(e):
                raise

config=Config()
