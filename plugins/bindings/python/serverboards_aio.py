import sys
import os
import json
import time
# from contextlib import contextmanager
sys.path.append(os.path.join(os.path.dirname(__file__),
                'env/lib64/python3.6/site-packages/'))
sys.path.append(os.path.join(os.path.dirname(__file__),
                'env/lib64/python3.5/site-packages/'))
import curio


_debug = False
plugin_id = os.environ.get("PLUGIN_ID")
real_print = print


def real_debug(*msg):
    if not _debug:
        return
    try:
        real_print("\r", *msg, file=sys.stderr)
    except Exception:
        pass


async def maybe_await(res):
    # if async, wait for response ## cr_running only on async funcs
    if not res:
        return res
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
        self.__run_queue = curio.queue.UniversalQueue()
        self.__running = False
        self.__running_calls = []
        self.__waiting_calls = []
        self.__background_tasks = 0

    async def stop(self):
        self.__running = False
        await self.__call_group.cancel_remaining()
        await self.__call_group.join(wait=all)
        await self.__run_queue.put("QUIT")
        if self.stdin:
            await self.stdin.close()

    def register(self, name, function):
        self.__methods[name] = function
        return self

    async def __send(self, js):
        jss = json.dumps(js)
        if _debug:
            real_debug(">>> %s" % jss)
        await self.stdout.write(jss + "\n")
        await self.stdout.flush()

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
                real_debug("Invalid response id, not waiting for it", q)
                raise Exception("invalid-response-id")
            await q.put(req)
        else:
            real_debug("unknown request", req)
            raise Exception("unknown-request")

    async def __parse_call(self, id, method, params):
        try:
            self.__running_calls.append(method)
            fn = self.__methods.get(method)
            if not fn:
                if id:
                    await self.__send({
                        "error": "not-found %s" % method,
                        "id": id
                    })
                return

            if isinstance(params, list):
                res = fn(*params)
            else:
                res = fn(**params)

            res = await maybe_await(res)
            if id:
                await self.__send({"result": res, "id": id})
        except Exception as e:
            if id:
                await self.__send({"error": str(e), "id": id})
        finally:
            self.__running_calls.remove(method)

    async def call(self, method, *args, **kwargs):
        self.__waiting_calls.append(method)
        id = self.__call_id
        self.__call_id += 1
        q = curio.Queue()
        self.__wait_for_response[id] = q

        await self.__send({
            "method": method,
            "params": args or kwargs,
            "id": id
        })
        # await for answer in the answer queue
        res = await q.get()
        del self.__wait_for_response[id]

        self.__waiting_calls.remove(method)
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
        self.__running = True
        self.__run_tasks_task = await curio.spawn(self.__run_tasks)
        if not self.stdin:
            return
        try:
            async for line in self.stdin:
                line = line.strip()
                if _debug:
                    try:
                        real_debug("\r<<< %s\n" % line)
                    except Exception:
                        pass
                if line.startswith('# wait'):  # special command!
                    await curio.sleep(float(line[7:]))
                elif line == '# quit':
                    await self.stop()
                    return
                else:
                    await self.__parse_request(json.loads(line))
                if self.__running is False:
                    return
        except BrokenPipeError:
            return
        except curio.TaskCancelled:
            real_debug("Task cancelled")
            return
        except curio.CancelledError:
            real_debug("Cancelled file read")
            raise
        except Exception as e:
            real_debug("Unexpected exception", e)
            import traceback
            traceback.print_exc()

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

    def run_async(self, method, *args, result=True, **kwargs):
        q = None
        if self.__running and result:
            q = curio.queue.UniversalQueue()
        self.__run_queue.put((method, args, kwargs, q))
        if q:
            res = q.get()
            q.task_done()
            q.join()
            return res
        return None

    async def __run_tasks(self):
        while True:
            if not self.__running:
                return
            res = await self.__run_queue.get()
            if res == "QUIT":
                return
            (method, args, kwargs, q) = res

            async def run_in_task():
                self.__background_tasks += 1
                try:
                    res = method(*args, **kwargs)
                    res = await maybe_await(res)
                    if q:
                        await q.put(res)
                except BrokenPipeError:
                    return  # finished! Normally write to closed stdout
                except curio.TaskCancelled as e:
                    return
                except Exception as e:
                    if q:
                        await q.put(e)
                finally:
                    self.__background_tasks -= 1

            await curio.spawn(run_in_task, daemon=True)  # no join

    def status(self):
        return {
            "running": self.__running_calls,
            "waiting": self.__waiting_calls,
            "background": self.__background_tasks,
        }


rpc = RPC()


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


@rpc_method("status")
def status():
    return rpc.status()


async def call(method, *args, **kwargs):
    return await rpc.call(method, *args, **kwargs)


async def call_event(method, *args, **kwargs):
    return await rpc.event(method, *args, **kwargs)


def loop(**kwargs):
    curio.run(rpc.loop, **kwargs)


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
                value = await maybe_await(f(*args, **kwargs))
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
        if data.endswith('\n'):
            data = data[:-1]
        await self.fn(data, *args, **{**{"level": 1}, **self.extra, **extra})

    def flush(*args, **kwargs):
        pass

    # @contextmanager
    # async def context(self, level=2, **extra):
    #     value = io.StringIO()
    #     await value
    #     value.seek(0)
    #     await self.fn(value.read(),
    #                   **{**{"level": level}, **self.extra, **extra})


class WriteToSync:
    def __init__(self, fn, **extra):
        self.fn = fn
        self.extra = extra

    def __call__(self, *args, **extra):
        nextra = {**{"level": 1}, **self.extra, **extra}
        if not args:  # if no data, add extras for contexts.
            return WriteToSync(self.fn, **nextra)
        run_async(self.fn, *args, result=False, **nextra)

    def write(self, data, *args, **extra):
        return
        if data.endswith('\n'):
            data = data[:-1]
        run_async(self.fn, data, *args,
                  result=False, **{**{"level": 1}, **self.extra, **extra})

    def flush(*args, **kwargs):
        pass


def log_(type):
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
        if not msg:
            return
        if _debug:
            real_debug("\r", *msg, "\n\r")
        msg = ' '.join(str(x) for x in msg)
        if not msg.strip():
            return
        # print("Inner msg", repr(msg),
        #       decorate_log(extra, level=level + 2),
        #       file=sys.stderr)
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


error = WriteTo(log_("error"))
debug = WriteTo(log_("debug"))
info = WriteTo(log_("info"))
warning = WriteTo(log_("warning"))
error_sync = WriteToSync(log_("error"))

# all normal prints go to debug channel
# sys.stdout = WriteToSync(log_("debug"))
# sys.stdout = sys.stderr


def log_traceback(exc=None):
    """
    Logs the given traceback to the error log.
    """
    import traceback
    if exc:
        run_async(error, "Got exception: %s" % exc, level=1, result=False)
    traceback.print_exc(file=error_sync)


def test_mode(mock_data={}):
    """
    Starts test mode with smock mocking library.

    Once the mock mode starts, there is no way to stop it, but restart the
    program. Use under some --test flag.
    """
    from smock import mock_res
    print = real_print

    async def __mock_send(req):
        method = req.get('method')
        if method:
            id = req.get('id')
            params = req["params"]
            if not id:
                if method == 'log.error':
                    print(params[0])
                    return
                print(">>>", method, params)
                return
            try:
                print(">>>", method, params)
                if isinstance(params, (list, tuple)):
                    args = params
                    kwargs = {}
                else:
                    args = []
                    kwargs = params
                res = mock_res(method, mock_data, args=args, kwargs=kwargs)
                resp = {
                    "result": res,
                    "id": req.get("id")
                }
                print("<<<", json.dumps(res._MockWrapper__data, indent=2))
                await rpc._RPC__parse_request(resp)
            except Exception as e:
                await error("Error (%s) mocking call: %s" % (e, req))
                import traceback; traceback.print_exc()
                resp = {
                    "error": str(e),
                    "id": req.get("id")
                }
                print("<<<", json.dumps({"error": str(e)}, indent=2))
                await rpc._RPC__parse_request(resp)

            return
        print(">>>", req)

    # print(dir(serverboards.rpc))
    rpc._RPC__send = __mock_send


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
    return rpc.run_async(method, *args, **kwargs)


def set_debug(on=True):
    global _debug
    _debug = on


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


async def sync(f, *args, **kwargs):
    """
    Runs a sync function in an async environment.

    It may generate a new thread, so f must be thread safe.

    Not using curio run_in_thread as it was cancelling threads and
    not working, maybe due to not finished lib.
    """
    import threading
    q = curio.queue.UniversalQueue()

    def run_in_thread():
        try:
            res = f(*args, **kwargs)
        except Exception as e:
            res = e
        q.put(res)

    thread = threading.Thread(target=run_in_thread)
    thread.start()  # another thread
    res = await q.get()
    thread.join()
    await q.task_done()
    await q.join()
    if isinstance(res, Exception):
        raise res
    return res


def async(f, *args, **kwargs):
    """
    Runs an async function in a sync environment.

    Defers the call to the main thread loop, and waits for the response.

    It MUST be called from another thread.
    """
    return rpc.run_async(f, *args, **kwargs)
