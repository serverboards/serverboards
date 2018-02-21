import sys
import os
import json
import time
import io
import curio
from contextlib import contextmanager


plugin_id = os.environ.get("PLUGIN_ID")


async def maybe_await(res):
    # if async, wait for response ## cr_running only on async funcs
    if hasattr(res, "cr_running"):
        res = await res
    return res


class RPC:
    def __init__(self):
        self.stdin = curio.file.AsyncFile(sys.stdin)
        self.stdout = curio.file.AsyncFile(sys.stdout)
        self.__call_id = 1
        self.__methods = {}
        self.__call_group = curio.TaskGroup()
        # queues to wait for response of each of the remote calls
        # indexed by method call id
        self.__wait_for_response = {}
        # subscriptions to events
        self.__subscriptions = {}
        self.__subscriptions_by_id = {}
        self.__subscription_id = 1
        self.__run_queue = []

    def stop(self):
        self.__call_group.join(wait=all)
        self.__run_queue_task.join()

    def register(self, name, function):
        self.__methods[name] = function
        return self

    async def __send(self, js):
        await self.stdout.write(json.dumps(js) + "\n")
        await self.__run_tasks()

    async def __parse_request(self, req):
        method = req.get("method")
        id = req.get("id")
        if method:
            params = req.get("params")
            await self.__call_group.spawn(self.__parse_call,
                                          id, method, params)
        elif id:
            #  got result
            q = self.__wait_for_response.get(id)
            if not q:
                raise Exception("invalid-response-id")
            await q.put(req)
        else:
            raise Exception("unknown-request")

    async def __parse_call(self, id, method, params):
        fn = self.__methods.get(method)
        if not fn:
            if id:
                await self.__send({"error": "not-found %s" % method, "id": id})
            return
        try:
            if isinstance(params, list):
                res = fn(*params)
            else:
                res = fn(**params)

            res = maybe_await(res)

            if id:
                await self.__send({"result": res, "id": id})
        except Exception as e:
            import traceback
            traceback.print_exc()
            if id:
                await self.__send({"error": str(e), "id": id})

    async def call(self, method, *args, **kwargs):
        id = self.__call_id
        self.__call_id += 1
        res = await self.__send({
            "method": method,
            "params": args or kwargs,
            "id": id
        })
        q = curio.Queue()
        self.__wait_for_response[id] = q
        # await for answer in the answer queue
        res = await q.get()
        del self.__wait_for_response[id]
        error = res.get("error")
        if error:
            raise Exception(error)

        return res.get("result")

    async def event(self, method, *args, **kwargs):
        await self.__send({
            "method": method,
            "params": args or kwargs,
        })

    def method_list(self):
        return list(self.__methods.keys())

    async def loop(self):
        await curio.spawn(self.__run_tasks, daemon=True)
        try:
            async for line in self.stdin:
                line = line.strip()
                if line.startswith('# wait'):  # special command!
                    await curio.sleep(float(line[7:]))
                else:
                    await self.__parse_request(json.loads(line))
                await self.__run_tasks()
        except curio.CancelledError:
            print("Cancelled file read")
            raise

    async def subscribe(self, eventname, callback):
        """
        Subscribes to an event

        If the other side launches the given event, it calls the callback.

        It returns an id that can be used for unsubscription.
        """
        # subscribes to the real event, not the filtering
        event = eventname.split('[', 1)[0]
        id = self.__subscription_id
        self.__subscription_id += 1
        subs = self.__subscriptions.get(event, []).concat(callback)
        self.__subscriptions[event] = subs
        self.__subscriptions_by_id[id] = (event, callback)

        await self.call("event.subscribe", eventname)

        return id

    async def unsubscribe(self, id):
        if id not in self.__subscriptions_ids:
            return False

        (event, callback) = self.__subscriptions_ids[id]
        subs = self.__subscriptions[event]
        subs = [x for x in subs if x != callback]
        if subs:
            self.__subscriptions[event] = subs
        else:
            del self.__subscriptions[event]
            await self.call("event.unsubscribe", event)

        del self.__subscriptions_ids[id]
        return True

    def run_async(self, method, *args, **kwargs):
        self.__run_queue.append((method, args, kwargs))

    async def __run_tasks(self):
        while len(self.__run_queue) > 0:
            (method, args, kwargs) = self.__run_queue.pop()
            try:
                res = method(*args, **kwargs)
                await maybe_await(res)
            except Exception as e:
                log_traceback(e)


rpc = RPC()
sys.stdout = sys.stderr  # all normal prints go to stderr


def rpc_method(fnname):
    if isinstance(fnname, str):
        def register(fn):
            rpc.register(fnname, fn)
            return fn
        return register
    rpc.register(fnname.__name__, fnname)
    return fnname


@rpc_method("dir")
def list_all_methods():
    return rpc.method_list()


async def call(method, *args, **kwargs):
    return await rpc.call(method, *args, **kwargs)


async def call_event(method, *args, **kwargs):
    return await rpc.event(method, *args, **kwargs)


def loop():
    curio.run(rpc.loop())


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

        async def wrapped(*args, **kwargs):
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
                value = await f(*args, **kwargs)
                # store
                data[hs] = (currentt + ttl, value)
            return value

        def invalidate_cache():
            nonlocal data
            data = {}

        wrapped.invalidate_cache = invalidate_cache
        return wrapped
    return wrapper


class WriteTo:
    def __init__(self, fn, **extra):
        self.fn = fn
        self.extra = extra

    async def __call__(self, *args, **extra):
        nextra = {**{"level": 1}, **self.extra, **extra}
        if not args:  # if no data, add extras for contexts.
            return WriteTo(self.fn, **nextra)
        await self.fn(*args, **nextra)

    async def write(self, data, *args, **extra):
        log_traceback()
        if data.endswith('\n'):
            data = data[:-1]
        await self.fn(data, *args, **{**{"level": 1}, **self.extra, **extra})

    def flush(*args, **kwargs):
        pass

    @contextmanager
    async def context(self, level=2, **extra):
        value = io.StringIO()
        yield value
        value.seek(0)
        await self.fn(value.read(),
                      **{**{"level": level}, **self.extra, **extra})


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

    async def log_inner(*msg, level=0, file=None, **extra):
        msg = ' '.join(str(x) for x in msg)
        if file is not None:
            await maybe_await(file.write(msg + "\n"))
        if not msg:
            return
        return await rpc.event(
            log_method,
            str(msg),
            decorate_log(extra, level=level + 2)
        )

    return log_inner


error = WriteTo(log_(rpc, "error"))
debug = WriteTo(log_(rpc, "debug"))
info = WriteTo(log_(rpc, "info"))
warning = WriteTo(log_(rpc, "warning"))


def log_traceback(exc=None):
    """
    Logs the given traceback to the error log.
    """
    import traceback
    if exc:
        run_async(error, "Got exception: %s", exc)
    traceback.print_exc(file=error)


real_print = print


def print(*args, file=None, **kwargs):
    if file:
        return real_print(*args, file=file, **kwargs)
    run_async(debug, *args, **kwargs)
    return None


def run_async(method, *args, **kwargs):
    """
    Bridge to call async from sync code and a run later facility

    This function allows to run later in the coro loop any required
    function that may require communication or async behaviour.

    This also allows to call an async function from sync code, for example,
    it is used in the print wrapper on the Serverboards API to call print
    as normal code (sync) but send the proper message to log the data on
    Serveboards CORE.

    The call will not be processed straight away, buut may be delayed until
    the process gets into some specific points in the serverboards loop.
    """
    rpc.run_async(method, *args, **kwargs)


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

    async def __call__(self, *args, **kwargs):
        if args and kwargs:
            return await rpc.call(self.module, *args, kwargs)
        return await rpc.call(self.module, *args, **kwargs)


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
