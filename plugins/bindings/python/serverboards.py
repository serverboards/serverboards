import json, os, sys, select, time

try:
    input=raw_input
except:
    pass

def ellipsis_str(str, maxs=50):
  if len(str)<maxs:
    return str
  else:
    return "%s...%s"%(str[:30], str[-20:])

class RPC:
    """
    Manages all the RPC status and calls.
    """
    def __init__(self, stdin, stdout):
        self.rpc_registry={}
        self.stdin=stdin
        self.stdout=stdout
        self.stderr=None
        self.loop_status='OUT' # IN | OUT | EXIT
        self.requestq=[] # requests that are pending to do
        self.replyq={} # replies got out of order: id to msg
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
        self.pending_events_queue=[]
        self.last_rpc_id=0

        class WriteToLog:
          def __init__(self, rpc):
            self.rpc=rpc
            self.buffer=[]
          def write(self, txt, *args, **kwargs):
              """
              Sends the error to the Serverboards core.

              If a line starts with traceback, it buffers all until the end of
              the traceback, to send it all in one go.
              """
              if not txt:
                  return
              if txt.startswith("Traceback"):
                  self.buffer.append(txt)
              elif self.buffer:
                  if txt.startswith(" "):
                      self.buffer.append(txt)
                  else:
                      self.buffer.append(txt)
                      self.rpc.error(''.join(self.buffer), extra=dict(file="EXCEPTION", line="--"))
                      self.buffer=[]
              else:
                  self.rpc.error(txt.rstrip())

        self.write_to_log=WriteToLog(self)

    def set_debug(self, debug):
        show_begin = not self.stderr
        if debug is True:
            self.stderr=sys.stderr
        else:
            self.stderr=debug
        if show_begin:
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

    def debug(self, *msg, extra={}, level=0):
        msg = ' '.join(str(x) for x in msg)
        self.debug_stdout(msg)
        return self.event("log.debug", str(msg), self.__decorate_log(extra, level=2+level))
    def error(self, *msg, extra={}, level=0):
        msg = ' '.join(str(x) for x in msg)
        self.debug_stdout(msg)
        return self.event("log.error", str(msg), self.__decorate_log(extra, level=2+level))
    def info(self, *msg, extra={}, level=0):
        msg = ' '.join(str(x) for x in msg)
        self.debug_stdout(msg)
        return self.event("log.info", str(msg), self.__decorate_log(extra, level=2+level))
    def warning(self, *msg, extra={}, level=0):
        msg = ' '.join(str(x) for x in msg)
        self.debug_stdout(msg)
        return self.event("log.warning", str(msg), self.__decorate_log(extra, level=2+level))

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
                #print(method, params, args, kwargs)
                res=f(*args, **kwargs)
                return {
                    'result' : res,
                    'id' : call_id
                    }
            except Exception as e:
                self.log_traceback(e)
                return {
                    'error': str(e),
                    'id' : call_id
                }
        if not call_id:
          self.emit_event(method, *args, **kwargs)
        else:
          return { 'error':'unknown_method %s'%method, 'id': call_id }

    def emit_event(self, method, *args, **kwargs):
        """
        Emits the event to the subscription watchers.

        It takes care of not doing reentries, at it leads to bugs, as
        for example processing data from one event, do some remote call, another
        event arrives, and finished before the first.

        This is a real ase of race condition writing to a file.

        The code here avoids the situation making events not reentrable; if
        processing an event, it queues newer to be delivered later.
        """
        do_later = len(self.pending_events_queue) > 0
        self.pending_events_queue.append( (method, args, kwargs) )
        if do_later:
            return
        #self.debug("Check subscriptions %s in %s"%(method, repr(self.subscriptions.keys())))
        # do all the items on the queue
        while len(self.pending_events_queue)>0:
          (method, args, kwargs) = self.pending_events_queue[0]
          if method in self.subscriptions:
              for f in self.subscriptions[method]:
                  if f:
                      try:
                          #self.debug("Calling %s b/o event %s(%s)"%(f, method, args or kwargs))
                          f(*args, **kwargs)
                      except Exception as e:
                          self.log_traceback(e)
          # pop from top
          self.pending_events_queue=self.pending_events_queue[1:]

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
                    try:
                      self.events[ready]()
                    except Exception as e:
                      self.log_traceback(e)
            else: # timeout
                self.timers[timeout_id]=(time.time()+timeout, timeout_id, timeout, timeout_cont)
                try:
                    timeout_cont()
                except Exception as e:
                  self.log_traceback(e)

        self.loop_status=prev_status

    def read_parse_line(self):
        l=self.stdin.readline()
        if not l:
            self.loop_stop()
            return
        self.debug_stdout("< %s"%ellipsis_str(l, 50))
        rpc = json.loads(l)
        self.__process_request(rpc)

    def add_event(self, fd, cont):
        if not fd in self.events:
            self.events[fd]=cont

    def remove_event(self, fd):
        if fd in self.events:
            del self.events[fd]
            return True
        return False

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

    def log_traceback(self, e = None):
      if e:
        self.error("Exception: %s"%str(e))
        import traceback
        traceback.print_exc(file=self.write_to_log)

    def __process_request(self, rpc):
        self.last_rpc_id=rpc.get("id")
        res=self.call_local(rpc)
        if res: # subscription do not give back response
            if res.get("id") not in self.manual_replies:
                try:
                    self.println(json.dumps(res))
                except Exception as e:
                    self.log_traceback(e)
                    sys.stderr.write(repr(res)+'\n')
                    self.println(json.dumps({"error": "serializing json response", "id": res["id"]}))
            else:
                self.manual_replies.discard(res.get("id"))

    def println(self, line):
        self.debug_stdout("> %s"%ellipsis_str(line, 50))
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

    def call(self, method, *params, **kwparams):
        """
        Calls a method on the other side and waits until answer.

        If receives a call while waiting for answer there are two behaviours:

        1. If at self.loop, processes the request inmediatly
        2. If not, queues it to be processed wehn loop is called

        This allows to setup the environment.
        """
        assert not params or not kwparams, "Use only *params(%s) or only **kwparams(%s)"%(params, kwparams)
        id=self.send_id
        self.send_id+=1
        rpc = json.dumps(dict(method=method, params=params or kwparams, id=id))
        self.println(rpc)
        return self.inner_loop(id, method=method)

    def inner_loop(self, id, method=None):
        """
        Performs an inner loop to be done whiel calling into the server.
        It is as the other loop, but until it get the proper reply.

        Requires the id of the reply to wait for, and the name of the mehtod for
        error reporting.
        """
        while True: # mini loop, may request calls while here
            res = sys.stdin.readline()
            self.debug_stdout("call res? < %s"%ellipsis_str(res))
            if not res:
                raise Exception("Closed connection")
            rpc = json.loads(res)
            if 'id' in rpc and ('result' in rpc or 'error' in rpc):
                # got answer for another request. This might be because I got a
                # request when I myself was waiting for an answer, got a request
                # which requested on the server. The second request is here waiting
                # for answer, but got the first request's answer. this also means
                # that this answer is for some other call upper in the call stack.
                # I save it for later.
                if rpc['id']==id:
                    self.debug_stdout("Done")
                    if 'result' in rpc:
                        return rpc['result']
                    else:
                        if rpc["error"]=="unknown_method":
                            raise Exception("unknown_method %s"%(method))
                        raise Exception(rpc["error"])
                else:
                    self.debug_stdout("Keep it for later, im waiting for %s"%id)
                    self.replyq[rpc['id']]=rpc
            else:
                if self.loop_status=="IN":
                    self.debug_stdout("Waiting for reply; Execute now for later: %s"% res)
                    self.__process_request(rpc)
                    # Now check if while I was answering this, I got my answer
                    rpc=self.replyq.get(id)
                    if rpc:
                        self.debug_stdout("Got my answer while replying to server")
                        del self.replyq[id]
                        if 'result' in rpc:
                            return rpc['result']
                        else:
                            if rpc["error"] == "unknown_method":
                                raise Exception("unknown_method %s"%method)
                            raise Exception(rpc["error"])
                else:
                    self.debug_stdout("Waiting for reply; Queue for later: %s"% res)
                    self.requestq.append(rpc)

    def subscribe(self, event, callback):
        """
        Subscribes for a serverevent, calling the callback(eventdata) when it
        happens.

        Returns a subscription id, tahta can be used to unsubscribe.
        """
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
        """
        Unsubscribes from an event.
        """
        if subscription_id in self.subscriptions:
          self.debug("%s in %s"%(subscription_id, repr(self.subscriptions_ids)))
          (event, callback) = self.subscriptions_ids[subscription_id]
          self.subscriptions[event]=[x for x in self.subscriptions[event] if x!=callback]
          self.debug("Removed subscription %s id %s"%(event, subscription_id))
          self.call("event.unsubscribe",event)
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

def debug(*s, extra={}):
    rpc.debug(*s, extra=extra, level=1)
def info(*s, extra={}):
    rpc.info(*s, extra=extra, level=1)
def warning(*s, extra={}):
    rpc.warning(*s, extra=extra, level=1)
def error(*s, extra={}):
    rpc.error(*s, extra=extra, level=1)

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


class Plugin:
    """
    Wraps a plugin to easily call the methods in it.

    It has no recovery in it.
    """
    class Method:
        def __init__(self, plugin, method):
            self.plugin=plugin
            self.method=method
        def __call__(self, *args, **kwargs):
            return rpc.call("plugin.call", self.plugin.uuid, self.method, args or kwargs)
    def __init__(self, plugin_id):
        self.plugin_id = plugin_id
        self.uuid=rpc.call("plugin.start", plugin_id)
    def __getattr__(self, method):
        if not self.uuid:
            self.uuid=rpc.call("plugin.start", plugin_id)
        return Plugin.Method(self, method)
    def stop(self):
        rpc.call("plugin.stop", self.uuid)
        self.uuid = None

    def __enter__(self):
      return self

    def __exit__(self, _type, _value, _traceback):
      self.stop()

class RPCWrapper:
    """
    Wraps any module or function to be able to be called.

    This allows to do a simple `service.get(uuid)`, given that before you did a
    `service = RPCWrapper("service")`.

    There are already some instances ready for importing as:
    `from serverboards import service, issues, rules, action`
    """
    def __init__(self, module):
        self.module = module
    def __getattr__(self, sub):
        return RPCWrapper(self.module+'.'+sub)
    def __call__(self, *args, **kwargs):
        return rpc.call(self.module, *args, **kwargs)

action = RPCWrapper("action")
auth = RPCWrapper("auth")
group = RPCWrapper("group")
perm = RPCWrapper("perm")
user = RPCWrapper("user")
dashboard = RPCWrapper("dashboard")
event = RPCWrapper("event")
issues = RPCWrapper("issues")
logs = RPCWrapper("logs")
notifications = RPCWrapper("notifications")
plugin = RPCWrapper("plugin")
plugin.component = RPCWrapper("plugin.component")
project = RPCWrapper("project")
rules = RPCWrapper("rules")
service = RPCWrapper("service")
settings = RPCWrapper("settings")
file = RPCWrapper("file")
print = debug
