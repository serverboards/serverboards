import json, os, sys, select, time, io
from contextlib import contextmanager

try:
    input=raw_input
except:
    pass

def ellipsis_str(str, maxs=50):
  if len(str)<maxs:
    return str
  else:
    firsth=int(maxs*3/4)
    lasth=maxs-firsth
    return "%s...%s"%(str[:firsth], str[-lasth:])

class RPC:
    """
    Manages all the RPC status and calls.
    """
    def __init__(self, stdin, stdout):
        """
        Initilize the JSON-RPC communication object

        This class allows to register methods, event handlers, timers and file
        descriptor handlers to ease the communication using JSON-RPC.

        # Parameters

        param | type       | description
        ------|------------|------------
        stdin | file       | Which input file to use to read JSON-RPC calls. Normally stdin.
        stdout | file      | File to use to write JSON-RPC calls to the remote endpoint. Normally stdout.

        """
        self.rpc_registry={}
        # ensure input is utf8, https://stackoverflow.com/questions/16549332/python-3-how-to-specify-stdin-encoding
        self.stdin=io.TextIOWrapper(sys.stdin.buffer, encoding='utf-8')
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
        self.async_cb={} # id to callback when receiving asynchornous responses

        class WriteToLog:
          """
          Helper class to write exceptions to the remote log.error method.
          """
          def __init__(self, rpc):
            """
            Initializes the object that will use the given rpc object to write
            logging data.
            """
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
        """
        Sets the debug mode for this rpc object.

        # Parameters

        param | type       | description
        ------|------------|------------
        debug | bool       | Whether to activate debug data to stderr
        debug | file       | To which file to write
        """
        show_begin = not self.stderr
        if debug is True:
            self.stderr=sys.stderr
        else:
            self.stderr=debug
        if show_begin:
            self.debug("--- BEGIN ---")


    def __decorate_log(self, extra, level=2):
        """
        Helper that decorates the given log messages with data of which function, line
        and file calls the log.
        """
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

    def debug(self, *msg, level=0, **extra):
        msg = ' '.join(str(x) for x in msg)
        self.debug_stdout(msg)
        return self.event("log.debug", str(msg), self.__decorate_log(extra, level=2+level))
    def error(self, *msg, level=0, **extra):
        msg = ' '.join(str(x) for x in msg)
        self.debug_stdout(msg)
        return self.event("log.error", str(msg), self.__decorate_log(extra, level=2+level))
    def info(self, *msg, level=0, **extra):
        msg = ' '.join(str(x) for x in msg)
        self.debug_stdout(msg)
        return self.event("log.info", str(msg), self.__decorate_log(extra, level=2+level))
    def warning(self, *msg, level=0, **extra):
        msg = ' '.join(str(x) for x in msg)
        self.debug_stdout(msg)
        return self.event("log.warning", str(msg), self.__decorate_log(extra, level=2+level))

    def debug_stdout(self, x):
        """
        Helper that writes to stderr some message.

        It adds the required \\r at the line start, as elixir/erlang removes them on
        externals processes / ports. Also adds the current PID to ease debugging,
        as diferent calls to the same command will have diferent pids.

        This is used when `self.debug` is in use.
        """
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
        """
        Adds a method to the local method registry.

        All local methods that can be caled b the remote endpoint have to be registered here.

        Normally the `@rpc_method` decorator is used for ease of use.
        """
        self.rpc_registry[name]=f

    def call_local(self, rpc):
        """
        Performs a local call into a registered method.

        This is use internally for all incomming rpc calls.
        """
        method=rpc['method']
        params=rpc['params'] or []
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

        This is a real case of race condition writing to a file.

        The code here avoids the situation making events not reentrable; if
        processing an event, it queues newer to be delivered later.
        """
        do_later = len(self.pending_events_queue) > 0
        self.pending_events_queue.append( (method, args, kwargs) )
        if do_later:
            self.debug("No emit %s yet, as processing something else"%method)
            return
        self.debug("Check subscriptions %s in %s"%(method, repr(self.subscriptions.keys())))
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
        """
        Ener into the read remote loop.

        This loop also perform the timers watch and extra fds select.
        """
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
                timer=min(self.timers.values(), key=lambda x:x.next)
                next_timeout=timer.next - time.time()
            else:
                timer = None
                next_timeout = None

            # self.debug("Next timeout", next_timeout, timeout_id)
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
                if timer.rearm:
                    timer.arm()
                else:
                    del self.timers[timer.id]
                # rearm ?? Docs says no rearming
                try:
                    timer.cont()
                except Exception as e:
                  self.log_traceback(e)


        self.loop_status=prev_status

    def read_parse_line(self):
        """
        Reads a line from the rpc input line, and parses it.
        """
        l=self.stdin.readline()
        self.debug_stdout("< %s"%ellipsis_str(l))
        if not l:
            self.loop_stop()
            return
        rpc = json.loads(l)
        self.__process_request(rpc)

    def add_event(self, fd, cont):
        """
        Watches for changes in a external file descriptor and calls the continuation function.

        This allows this class to also listen for external processes and file description changes.

        # Parameters

        param | type       | description
        ------|------------|------------
        fd    | int        | File descriptor
        cont  | function() | Continuation function to call when new data ready to read at fd
        """
        if not fd in self.events:
            self.events[fd]=cont

    def remove_event(self, fd):
        """
        Removes an event from the event watching list
        """
        if fd in self.events:
            del self.events[fd]
            return True
        return False

    def add_timer(self, interval, cont, rearm=False):
        """
        Adds a timer to the rpc object

        After the given interval the continuation object will be called.
        The timer is not rearmed; it must be added again by the caller if
        desired.

        This timers are not in realtime, and may be called well after the
        timer expires, if the process is performing other actions, but will be
        called as soon as possible.

        # Parameters

        param | type       | description
        ------|------------|------------
        interval | float   | Time in seconds to wait until calling this timer
        cont  | function() | Function to call when the timer expires.
        rearm | bool       | Whether this timer automatically rearms. Default false.

        # Returns
        timer_id : int
          Timer id to be used for later removal of timer
        """
        class Timer:
            def __init__(self, id, interval, cont, rearm):
                self.next=None
                self.id=id
                self.interval=interval
                self.cont=cont
                self.rearm=rearm

                self.arm()
            def arm(self):
                self.next=time.time() + self.interval
                return self
        tid=self.timer_id
        self.timers[tid]=Timer(tid, interval, cont, rearm)

        self.timer_id+=1
        return tid

    def remove_timer(self, tid):
        """
        Removes a timer.
        """
        if tid in self.timers:
            del self.timers[tid]

    def loop_stop(self, debug=True):
        """
        Forces loop stop on next iteration.

        This can be used to force program stop, although normally
        serverboards will emit a SIGSTOP signal to stop processes when
        required.
        """
        if debug:
          self.debug("--- EOF ---")
        self.loop_status='EXIT'

    def log_traceback(self, e = None):
      if e:
        self.error("Exception: %s"%str(e))
        import traceback
        traceback.print_exc(file=self.write_to_log)

    def __process_request(self, rpc):
        """
        Performs the request processing to the external RPC endpoint.

        This internal function is used to do the real writing to the
        othe rend, as in some conditions it ma be delayed.
        """
        self.last_rpc_id=id=rpc.get("id")
        self.debug_stdout(repr(rpc))
        self.debug_stdout(repr(self.async_cb))
        async_cb=self.async_cb.get(id) # Might be an asynchronous result or error
        if async_cb:
            error_cb = None # User can set only success condition, or a tuple with both
            if type(async_cb)==tuple:
                async_cb, error_cb = async_cb

            try: # try to call the error or result handlers
                if async_cb and 'result' in rpc:
                    async_cb(rpc.get("result"))
                elif error_cb and 'error' in rpc:
                    error_cb(rpc.get("error"))
            except Exception as e:
                self.log_traceback(e)
            del self.async_cb[id]
        else:
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
        """
        Prints a line onto the external endpoint.

        This function allows for easy debugging and some error conditions.
        """
        self.debug_stdout("> %s"%line)
        try:
          self.stdout.write(line + '\n')
          self.stdout.flush()
        except IOError:
          if self.loop_status=='EXIT':
            sys.exit(1)
          self.loop_stop(debug=False)



    def log(self, message=None, type="LOG"):
        """
        Writes a log message on the other end.

        Used by error, debug and info.
        """
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

    def call(self, method, *params, _async=False, **kwparams):
        """
        Calls a method on the other side and waits until answer.

        If receives a call while waiting for answer there are two behaviours:

        1. If at self.loop, processes the request inmediatly
        2. If not, queues it to be processed wehn loop is called

        This allows to setup the environment.

        Optional arguments:
         * _async -- Set to a callback to be called when the answer is received.
                     Makes the call asynchronous. callback receives the answer.
                     It is called with response None in case of error.
        """
        id=self.send_id
        self.send_id+=1
        # if both, pass kwparams as last argument. This sensible default works
        # with for example action calling and passing more calls to plugins
        if params and kwparams:
            params = [*params, kwparams]
        rpc = json.dumps(dict(method=method, params=params or kwparams, id=id))
        self.println(rpc)
        if _async: # Will get answer later calling the _async callback
            self.async_cb[id]=_async
            return
        return self.inner_loop(id, method=method)

    def inner_loop(self, id, method=None):
        """
        Performs an inner loop to be done while calling into the server.
        It is as the other loop, but until it get the proper reply.

        Requires the id of the reply to wait for, and the name of the method for
        error reporting.
        """
        while True: # mini loop, may request calls while here
            res = self.stdin.readline()
            self.debug_stdout("<< %s"%ellipsis_str(res))
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
                            if self.stderr:
                                self.debug_stdout("Call to remote unknown method %s known are %s. check permissions."%(method, self.call("dir")))
                            raise Exception("unknown_method %s"%method)
                        raise Exception("%s at %s"%(rpc["error"], method))
                elif id in self.async_cb:
                    try:
                        self.async_cb[id]()
                    except Exception as e:
                        self.log_traceback(e)
                    del self.async_cb[id]
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

# RPC singleton
rpc=RPC(sys.stdin, sys.stdout)
sys.stdout=sys.stderr # allow debugging by print

def rpc_method(f):
    """
    Decorator to add this method to the known RPC methods.

    Use as simple decorator:

    ```python
    @decorator
    def func(param1, param2):
        ....
    ```

    or with a specific name

    ```python
    @decorator("rpc-name")
    def func(param1=None):
        ...
    ```
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
    """
    Returns the list of all registered methods.

    Normally used by the other endpoint.
    """
    return list( rpc.rpc_registry.keys() )

def loop(debug=None):
    """
    Wrapper to easily start rpc loop

    It allows setting the debug flag/file here.

    # Parameters

    param | type       | description
    ------|------------|------------
    debug | bool\|file | Whether to debug to stderr, or to another file object


    """
    if debug:
        rpc.set_debug(debug)
    rpc.loop()

class WriteTo:
    def __init__(self, fn, **extra):
        self.fn = fn
        self.extra = extra
    def __call__(self, *args, **extra):
        if not args: # if no data, add extras for contexts.
            return WriteTo(self.fn, **{**self.extra, **extra})
        self.fn(*args, **{**{"level":1}, **extra})
    def write(self, data, *args, **extra):
        if data.endswith('\n'):
            data=data[:-1]
        self.fn(data, *args, **{**{"level":1}, **extra})
    @contextmanager
    def context(self, level=2, **extra):
        value = io.StringIO()
        yield value
        value.seek(0)
        self.fn(value.read(), **{**{"level":level}, **extra})

error = WriteTo(rpc.error)
debug = WriteTo(rpc.debug)
info = WriteTo(rpc.info)
warning = WriteTo(rpc.warning)

def __simple_hash__(*args, **kwargs):
    hs = ";".join(str(x) for x in args)
    hs += ";"
    hs += ";".join(
      "%s=%s"%(
        __simple_hash__(k),
        __simple_hash__(kwargs[k])
        ) for k in sorted( kwargs.keys() ) )
    return hash(hs)

def cache_ttl(ttl=10, maxsize=50, hashf=__simple_hash__):
    """
    Simple decorator, not very efficient, for a time based cache.

    Params:
        ttl -- seconds this entry may live. After this time, next use is evicted.
        maxsize -- If trying to add more than maxsize elements, older will be evicted.
        hashf -- Hash function for the arguments. Defaults to same data as keys, but may require customization.

    """
    def wrapper(f):
        data = {}
        def wrapped(*args, **kwargs):
            nonlocal data
            currentt = time.time()
            if len(data)>=maxsize:
                # first take out all expired
                data = { k:(timeout,v) for k,(timeout, v) in data.items() if timeout>currentt }
                if len(data)>=maxsize:
                    # not enough, expire oldest
                    oldest_k=None
                    oldest_t=currentt+ttl
                    for k,(timeout,v) in data.items():
                        if timeout<oldest_t:
                            oldest_k=k
                            oldest_t=timeout

                    del data[oldest_k]
            assert len(data)<maxsize

            if not args and not kwargs:
                hs = None
            else:
                hs = hashf(*args, **kwargs)
            timeout, value = data.get(hs, (currentt, None))
            if timeout<=currentt or not value:
                # recalculate
                value = f(*args, **kwargs)
                # store
                data[hs]=(currentt + ttl, value)
            return value
        def invalidate_cache():
          nonlocal data
          data = {}

        wrapped.invalidate_cache = invalidate_cache
        return wrapped
    return wrapper

class Config:
    """
    Easy access some configuration data for this plugin
    """
    def __init__(self):
        self.path=os.path.expanduser( os.environ.get('SERVERBOARDS_PATH','~/.local/serverboards/') )
        Config.__ensure_path_exists(self.path)

    def file(self, filename):
        """
        Gets the absolute path of a local file for this plugin.

        This uses the serverboards configured local storage for the current plugin
        """
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
# config singleton
config=Config()

class Plugin:
    """
    Wraps a plugin to easily call the methods in it.

    It has no recovery in it.

    Can specify to ensure it is dead (kill_and_restart=True) before use. This
    is only useful at tests.
    """
    class Method:
        def __init__(self, plugin, method):
            self.plugin=plugin
            self.method=method
        def __call__(self, *args, _async=False, **kwargs):
            return rpc.call("plugin.call", self.plugin.uuid, self.method, args or kwargs, _async=_async)

    def __init__(self, plugin_id, kill_and_restart = False, restart = True):
        self.plugin_id = plugin_id
        if kill_and_restart:
          try:
            rpc.call("plugin.kill", plugin_id)
            time.sleep(1)
          except:
            pass
        self.restart=restart
        self.start()


    def __getattr__(self, method):
        if not self.uuid:
            self.uuid=rpc.call("plugin.start", self.plugin_id)
        return Plugin.Method(self, method)

    def start(self):
        self.uuid=rpc.call("plugin.start", self.plugin_id)
        return self

    def stop(self):
        """
        Stops the plugin.
        """
        if not self.uuid: # not running
            return self
        rpc.call("plugin.stop", self.uuid)
        self.uuid = None
        return self

    def call(self, method, *args, _async=False, **kwargs):
        """
        Call a method by name.

        This is also a workaround calling methods called `call` and `stop`.
        """
        try:
            return rpc.call("plugin.call", self.uuid, method, args or kwargs, _async=_async)
        except Exception as e:
            if e == "exit" and self.restart: # if error because exitted, and may restart, restart and try again (no loop)
                self.start()
                return rpc.call("plugin.call", self.uuid, method, args or kwargs)
            else:
                raise



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
        if args and kwargs:
            return rpc.call(self.module, *args, kwargs)
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
