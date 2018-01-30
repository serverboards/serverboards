import json
import os
import sys
import select
import time
import io
from contextlib import contextmanager

plugin_id = os.environ.get("PLUGIN_ID")


def ellipsis_str(str, maxs=50):
    if len(str) < maxs:
        return str
    else:
        firsth = int(maxs * 3 / 4)
        lasth = maxs - firsth
        return "%s...%s" % (str[:firsth], str[-lasth:])


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

        param  | type     | description
        -------|----------|------------
        stdin  | file     | Which input file to use to read JSON-RPC calls.
        stdout | file     | File to write JSON-RPC calls. The remote endpoint.
        """
        self.__rpc_registry = {}
        # ensure input is utf8,
        # https://stackoverflow.com/questions/16549332/python-3-how-to-specify-stdin-encoding
        self.__stdin = io.TextIOWrapper(sys.stdin.buffer, encoding='utf-8')
        self.__stdout = stdout
        self.__loop_status = 'OUT'  # IN | OUT | EXIT
        self.__requestq = []  # requests that are pending to do
        self.__replyq = {}  # replies got out of order: id to msg
        self.__send_id = 1  # current id to send
        self.__manual_replies = set()  # this has been replied with `reply`
        self.__events = {}
        # timer_id -> (next_stop, id, seconds, continuation)
        self.__timers = {}
        self.__timer_id = 1
        self.__subscriptions = {}
        self.__subscriptions_ids = {}
        self.__subscription_id = 1
        self.__pending_events_queue = []
        # This is the last id received from the other side
        self.__last_rpc_id = 0
        # id to callback when receiving asynchornous responses
        self.__async_cb = {}

        self.add_event(sys.stdin, self.__read_parse_line)

    def __call_local(self, rpc):
        """
        Performs a local call into a registered method.

        This is use internally for all incomming rpc calls.
        """
        method = rpc['method']
        params = rpc['params'] or []
        call_id = rpc.get('id')
        (args, kwargs) = ([], params) if type(params) == dict else (params, {})

        if method in self.__rpc_registry:
            f = self.__rpc_registry[method]
            try:
                # print(method, params, args, kwargs)
                res = f(*args, **kwargs)
                return {
                    'result': res,
                    'id': call_id
                }
            except Exception as e:
                log_traceback(e)
                return {
                    'error': str(e),
                    'id': call_id
                }
        if not call_id:
            self.__emit_event(method, *args, **kwargs)
        else:
            return {'error': 'unknown_method %s' % method, 'id': call_id}

    def __emit_event(self, method, *args, **kwargs):
        """
        Emits the event to the subscription watchers.

        It takes care of not doing reentries, at it leads to bugs, as
        for example processing data from one event, do some remote call,
        another event arrives, and finished before the first.

        This is a real case of race condition writing to a file.

        The code here avoids the situation making events not reentrable; if
        processing an event, it queues newer to be delivered later.
        """
        do_later = len(self.__pending_events_queue) > 0
        self.__pending_events_queue.append((method, args, kwargs))
        if do_later:
            debug("No emit %s yet, as processing something else" % method)
            return
        # debug("Check subscriptions %s in %s"%(method,
        #        repr(self.__subscriptions.keys())))
        # do all the items on the queue
        while len(self.__pending_events_queue) > 0:
            (method, args, kwargs) = self.__pending_events_queue[0]
            if method in self.__subscriptions:
                for f in self.__subscriptions[method]:
                    if f:
                        try:
                            # debug("Calling %s b/o event %s(%s)" %
                            #       (f, method, args or kwargs))
                            f(*args, **kwargs)
                        except Exception as e:
                            log_traceback(e)
            # pop from top
            self.__pending_events_queue = self.__pending_events_queue[1:]

    def __loop(self):
        """
        Ener into the read remote loop.

        This loop also perform the timers watch and extra fds select.
        """
        prev_status = self.__loop_status
        self.__loop_status = 'IN'

        # pending requests
        while self.__requestq:
            rpc = self.__requestq[0]
            self.__requestq = self.__requestq[1:]
            self.__process_request(rpc)

        # incoming
        while self.__loop_status == 'IN':
            # debug("Wait fds: %s" %
            #       ([x.fileno() for x in self.__events.keys()]))
            if self.__timers:
                timer = min(self.__timers.values(), key=lambda x: x.next)
                next_timeout = timer.next - time.time()
            else:
                timer = None
                next_timeout = None

            # debug("Next timeout", next_timeout, timeout_id)
            if not next_timeout or next_timeout >= 0:
                res = select.select(self.__events.keys(), [], [], next_timeout)
                read_ready = res[0]
            else:  # maybe timeout already expired
                read_ready = []

            # debug("Ready fds: %s // maybe_timer %s" %
            #       ([x for x in read_ready], timeout_id))
            if read_ready:
                for ready in read_ready:
                    try:
                        self.__events[ready]()
                    except Exception as e:
                        log_traceback(e)
            else:  # timeout
                if timer.rearm:
                    timer.arm()
                else:
                    del self.__timers[timer.id]
                # rearm ?? Docs says no rearming
                try:
                    timer.cont()
                except Exception as e:
                    log_traceback(e)

        self.__loop_status = prev_status

    def __inner_loop(self, id, method=None):
        """
        Performs an inner loop to be done while calling into the server.
        It is as the other loop, but until it get the proper reply.

        Requires the id of the reply to wait for, and the name of the method
        for error reporting.
        """
        while True:  # mini loop, may request calls while here
            res = self.__stdin.readline()
            if not res:
                raise Exception("Closed connection")
            rpc = json.loads(res)
            if 'id' in rpc and ('result' in rpc or 'error' in rpc):
                # got answer for another request. This might be because I got a
                # request when I myself was waiting for an answer, got a
                # request which requested on the server. The second request is
                # here waiting for answer, but got the first request's answer.
                # This also means that this answer is for some other call upper
                # in the call stack. I save it for later.
                if rpc['id'] == id:
                    if 'result' in rpc:
                        return rpc['result']
                    else:
                        if rpc["error"] == "unknown_method":
                            raise Exception("unknown_method %s" % method)
                        raise Exception("%s at %s" % (rpc["error"], method))
                elif id in self.__async_cb:
                    try:
                        self.__async_cb[id]()
                    except Exception as e:
                        log_traceback(e)
                    del self.__async_cb[id]
                else:
                    self.__replyq[rpc['id']] = rpc
            else:
                if self.__loop_status == "IN":
                    self.__process_request(rpc)
                    # Now check if while I was answering this, I got my answer
                    rpc = self.__replyq.get(id)
                    if rpc:
                        del self.__replyq[id]
                        if 'result' in rpc:
                            return rpc['result']
                        else:
                            if rpc["error"] == "unknown_method":
                                raise Exception("unknown_method %s" % method)
                            raise Exception(rpc["error"])
                else:
                    self.__requestq.append(rpc)

    def __read_parse_line(self):
        """
        Reads a line from the rpc input line, and parses it.
        """
        line = self.__stdin.readline()
        if not line:
            self.stop()
            return
        rpc = json.loads(line)
        self.__process_request(rpc)

    def __process_request(self, rpc):
        """
        Performs the request processing to the external RPC endpoint.

        This internal function is used to do the real writing to the
        other end, as in some conditions it may be delayed.
        """
        self.__last_rpc_id = id = rpc.get("id")
        # Might be an asynchronous result or error
        async_cb = self.__async_cb.get(id)
        if async_cb:
            # User can set only success condition, or a tuple with both
            error_cb = None
            if type(async_cb) == tuple:
                async_cb, error_cb = async_cb

            try:  # try to call the error or result handlers
                if async_cb and 'result' in rpc:
                    async_cb(rpc.get("result"))
                elif error_cb and 'error' in rpc:
                    error_cb(rpc.get("error"))
            except Exception as e:
                log_traceback(e)
            del self.__async_cb[id]
        else:
            res = self.__call_local(rpc)
            if res:  # subscription do not give back response
                if res.get("id") not in self.__manual_replies:
                    try:
                        self.__println(json.dumps(res))
                    except Exception as e:
                        log_traceback(e)
                        sys.stderr.write(repr(res) + '\n')
                        self.__println(json.dumps({
                            "error": "serializing json response",
                            "id": res["id"]
                        }))
                else:
                    self.__manual_replies.discard(res.get("id"))

    def __println(self, line):
        """
        Prints a line onto the external endpoint.

        This function allows for easy debugging and some error conditions.
        """
        try:
            self.__stdout.write(line + '\n')
            self.__stdout.flush()
        except IOError:
            if self.__loop_status == 'EXIT':
                sys.exit(1)
            self.stop()

    def add_method(self, name, f):
        """
        Adds a method to the local method registry.

        All local methods that can be caled b the remote endpoint have to be
        registered here.

        Normally the `@rpc_method` decorator is used for ease of use.
        """
        self.__rpc_registry[name] = f

    def loop(self):
        """
        Starts the remote reading mode.

        This loops indefinetely until stop_loop is called.
        """
        self.__loop()

    def stop(self):
        """
        Forces loop stop on next iteration.

        This can be used to force program stop, although normally
        serverboards will emit a SIGSTOP signal to stop processes when
        required.
        """
        debug("--- EOF ---")
        self.__loop_status = 'EXIT'

    def add_event(self, fd, cont):
        """
        Watches for changes in a external file descriptor and calls the
        continuation function.

        This allows this class to also listen for external processes and file
        description changes.

        # Parameters

        param | type       | description
        ------|------------|------------
        fd    | int        | File descriptor
        cont  | function() | Continuation function to call when new data ready
        """
        if fd not in self.__events:
            self.__events[fd] = cont

    def remove_event(self, fd):
        """
        Removes an event from the event watching list
        """
        if fd in self.__events:
            del self.__events[fd]
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
        rearm | bool       | Whether this timer automatically rearms. [false]

        # Returns
        timer_id : int
          Timer id to be used for later removal of timer
        """
        class Timer:
            def __init__(self, id, interval, cont, rearm):
                self.next = None
                self.id = id
                self.interval = interval
                self.cont = cont
                self.rearm = rearm

                self.arm()

            def arm(self):
                self.next = time.time() + self.interval
                return self

        tid = self.__timer_id
        self.__timers[tid] = Timer(tid, interval, cont, rearm)

        self.__timer_id += 1
        return tid

    def remove_timer(self, tid):
        """
        Removes a timer.
        """
        if tid in self.__timers:
            del self.__timers[tid]

    def event(self, method, *params, **kparams):
        """
        Sends an event to the other side
        """
        rpc = json.dumps(dict(method=method, params=params or kparams))
        self.__println(rpc)

    def reply(self, result):
        """
        Shortcuts request processing returning an inmediate answer. The final
        answer will be ignored.

        This allows to start long running processes that may send events in a
        loop.

        If more calls are expected, it is recomended to spawn new threads.
        """
        self.__manual_replies.add(self.__last_rpc_id)
        self.__println(json.dumps({
            "id": self.__last_rpc_id,
            "result": result
        }))

    def call(self, method, *params, _async=False, **kwparams):
        """
        Calls a method on the other side and waits until answer.

        If receives a call while waiting for answer there are two behaviours:

        1. If at self.loop, processes the request inmediatly
        2. If not, queues it to be processed wehn loop is called

        This allows to setup the environment.

        Optional arguments:
         * _async -- Set to a callback to be called when the answer is
                     received. Makes the call asynchronous. callback receives
                     the answer. It is called with response None in case of
                     error.
        """
        id = self.__send_id
        self.__send_id += 1
        # if both, pass kwparams as last argument. This sensible default works
        # with for example action calling and passing more calls to plugins
        if params and kwparams:
            params = [*params, kwparams]
        rpc = json.dumps(dict(method=method, params=params or kwparams, id=id))
        self.__println(rpc)
        if _async:  # Will get answer later calling the _async callback
            self.__async_cb[id] = _async
            return
        return self.__inner_loop(id, method=method)

    def subscribe(self, event, callback):
        """
        Subscribes for a serverevent, calling the callback(eventdata) when it
        happens.

        Returns a subscription id, tahta can be used to unsubscribe.
        """
        # maybe event[context], we keep only event as only events are sent.
        eventname = event.split('[', 1)[0]
        sid = self.__subscription_id

        events = self.__subscriptions.get(eventname, []) + [callback]
        self.__subscriptions[eventname] = events
        self.__subscriptions_ids[sid] = (eventname, callback)

        self.call("event.subscribe", event)
        self.__subscription_id += 1

        # debug("Subscribed to %s" % event)
        # debug("Added subscription %s id %s: %s"%(eventname, sid,
        #                     repr(self.__subscriptions[eventname])))
        return sid

    def unsubscribe(self, subscription_id):
        """
        Unsubscribes from an event.
        """
        if subscription_id in self.__subscriptions:
            debug("%s in %s" %
                  (subscription_id, repr(self.__subscriptions_ids))
                  )
            (event, callback) = self.__subscriptions_ids[subscription_id]
            self.__subscriptions[event] = [
                x for x in self.__subscriptions[event] if x != callback
            ]
            # debug("Removed subscription %s id %s" % (event, subscription_id))
            self.call("event.unsubscribe", event)
            del self.__subscriptions_ids[subscription_id]


# RPC singleton
rpc = RPC(sys.stdin, sys.stdout)
sys.stdout = sys.stderr  # allow debugging by print


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
    if type(f) == str:
        method_name = f

        def regf(f):
            # print("Registry %s: %s"%(method_name, repr(f)))
            rpc.add_method(method_name, f)
            return f
        return regf
    else:
        # print("Registry %s"%(f.__name__))
        rpc.add_method(f.__name__, f)
    return f


@rpc_method("dir")
def __dir():
    """
    Returns the list of all registered methods.

    Normally used by the other endpoint.
    """
    return list(rpc.rpc_registry.keys())


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
        nextra = {**{"level": 1}, **self.extra, **extra}
        if not args:  # if no data, add extras for contexts.
            return WriteTo(self.fn, **nextra)
        self.fn(*args, **nextra)

    def write(self, data, *args, **extra):
        if data.endswith('\n'):
            data = data[:-1]
        self.fn(data, *args, **{**{"level": 1}, **self.extra, **extra})

    def flush(*args, **kwargs):
        pass

    @contextmanager
    def context(self, level=2, **extra):
        value = io.StringIO()
        yield value
        value.seek(0)
        self.fn(value.read(), **{**{"level": level}, **self.extra, **extra})


def log_(rpc, type):
    def decorate_log(extra, level=2):
        """
        Helper that decorates the given log messages with data of which
        function, line and file calls the log.
        """
        import inspect
        callerf = inspect.stack()[level]

        caller = {
            "plugin_id": plugin_id,
            "function": callerf[3],
            "file": callerf[1],
            "line": callerf[2],
            "pid": os.getpid(),
        }
        caller.update(extra)
        return caller

    log_method = "log.%s" % type

    def log_inner(*msg, level=0, **extra):
        msg = ' '.join(str(x) for x in msg)
        return rpc.event(
            log_method,
            str(msg),
            decorate_log(extra, level=level)
        )

    return log_inner


error = WriteTo(log_(rpc, "error"))
debug = WriteTo(log_(rpc, "debug"))
info = WriteTo(log_(rpc, "info"))
warning = WriteTo(log_(rpc, "warning"))


def log_traceback(self, e=None):
    """
    Logs teh given traceback to the error log.
    """
    if e:
        import traceback
        traceback.print_exc(file=error)


def __simple_hash__(*args, **kwargs):
    hs = ";".join(str(x) for x in args)
    hs += ";"
    hs += ";".join(
        "%s=%s" % (
            __simple_hash__(k),
            __simple_hash__(kwargs[k])
        ) for k in sorted(kwargs.keys()))
    return hash(hs)


def cache_ttl(ttl=10, maxsize=50, hashf=__simple_hash__):
    """
    Simple decorator, not very efficient, for a time based cache.

    Params:
        ttl -- seconds this entry may live. After this time, next use is
               evicted.
        maxsize -- If trying to add more than maxsize elements, older will be
                   evicted.
        hashf -- Hash function for the arguments. Defaults to same data as
                 keys, but may require customization.
    """
    def wrapper(f):
        data = {}

        def wrapped(*args, **kwargs):
            nonlocal data
            currentt = time.time()
            if len(data) >= maxsize:
                # first take out all expired
                data = {
                    k: (timeout, v)
                    for k, (timeout, v) in data.items()
                    if timeout > currentt
                }
                if len(data) >= maxsize:
                    # not enough, expire oldest
                    oldest_k = None
                    oldest_t = currentt + ttl
                    for k, (timeout, v) in data.items():
                        if timeout < oldest_t:
                            oldest_k = k
                            oldest_t = timeout

                    del data[oldest_k]
            assert len(data) < maxsize

            if not args and not kwargs:
                hs = None
            else:
                hs = hashf(*args, **kwargs)
            timeout, value = data.get(hs, (currentt, None))
            if timeout <= currentt or not value:
                # recalculate
                value = f(*args, **kwargs)
                # store
                data[hs] = (currentt + ttl, value)
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
        self.path = os.path.expanduser(
            os.environ.get('SERVERBOARDS_PATH', '~/.local/serverboards/')
        )
        Config.__ensure_path_exists(self.path)

    def file(self, filename):
        """
        Gets the absolute path of a local file for this plugin.

        This uses the serverboards configured local storage for the current
        plugin
        """
        p = os.path.join(self.path, filename)
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
config = Config()


class Plugin:
    """
    Wraps a plugin to easily call the methods in it.

    It has no recovery in it.

    Can specify to ensure it is dead (kill_and_restart=True) before use. This
    is only useful at tests.
    """
    class Method:
        def __init__(self, plugin, method):
            self.plugin = plugin
            self.method = method

        def __call__(self, *args, **kwargs):
            return self.plugin.call(self.method, *args, **kwargs)

    def __init__(self, plugin_id, kill_and_restart=False, restart=True):
        self.plugin_id = plugin_id
        if kill_and_restart:
            try:
                rpc.call("plugin.kill", plugin_id)
                time.sleep(1)
            except Exception:
                pass
        self.restart = restart
        self.start()

    def __getattr__(self, method):
        if not self.uuid:
            self.uuid = rpc.call("plugin.start", self.plugin_id)
        return Plugin.Method(self, method)

    def start(self):
        self.uuid = rpc.call("plugin.start", self.plugin_id)
        return self

    def stop(self):
        """
        Stops the plugin.
        """
        if not self.uuid:  # not running
            return self
        rpc.call("plugin.stop", self.uuid)
        self.uuid = None
        return self

    RETRY_EVENTS = ["exit", "unknown_plugin at plugin.call", "unknown_plugin"]

    def call(self, method, *args, _async=False, **kwargs):
        """
        Call a method by name.

        This is also a workaround calling methods called `call` and `stop`.
        """
        try:
            return rpc.call(
                "plugin.call",
                self.uuid,
                method,
                args or kwargs,
                _async=_async
            )
        except Exception as e:
            # if exited or plugin call returns unknown method (refered to the
            # method to call at the plugin), restart and try again.
            if (str(e) in Plugin.RETRY_EVENTS) and self.restart:
                # if error because exitted, and may restart,
                # restart and try again (no loop)
                debug("Restarting plugin", self.plugin_id)
                self.start()
                return rpc.call(
                    "plugin.call",
                    self.uuid,
                    method,
                    args or kwargs
                )
            else:
                raise

    def __enter__(self):
        return self

    def __exit__(self, _type, _value, _traceback):
        try:
            self.stop()
        except Exception as ex:
            if str(ex) != "cant_stop at plugin.stop":
                raise


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
        return RPCWrapper(self.module + '.' + sub)

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
rules_v2 = RPCWrapper("rules_v2")
service = RPCWrapper("service")
settings = RPCWrapper("settings")
file = RPCWrapper("file")
print = debug
