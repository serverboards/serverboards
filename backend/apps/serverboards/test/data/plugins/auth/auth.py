#!/usr/bin/python
from __future__ import print_function
import serverboards, sys, time, json

PLUGIN_ID="serverboards.test.auth"

@serverboards.rpc_method
def auth_token(type="fake", token=None):
    serverboards.debug("Try auth by token: %s"%token)
    if token=="XXX":
        return 'dmoreno@serverboards.io'
    return False

@serverboards.rpc_method
def freepass(type="freepass", email="dmoreno@serverboards.io", **kwargs):
    # use existing one, or fail
    serverboards.debug("Freepass for %s"%email)
    return email

@serverboards.rpc_method
def new_user(type="newuser", username=None, **kwargs):
    assert username
    # create if does not exist, update groups
    return {
        "username": username,
        "groups": ["user", "admin"],
        "name": username
    }

@serverboards.rpc_method
def ping(*args):
    return 'pong'

@serverboards.rpc_method
def pingm(message=None):
    return message

@serverboards.rpc_method
def abort(*args, **kwargs):
    serverboards.debug("Pretend to work")
    time.sleep(0.500)
    serverboards.debug("Aborting")
    sys.exit(1)

@serverboards.rpc_method
def exception(*args, **kwargs):
    raise Exception("Exception requested")

@serverboards.rpc_method
def bad_protocol(*args):
    serverboards.debug("Invalid message")
    return True

@serverboards.rpc_method
def http_get(url=None, sleep=0.100):
    sys.stderr.write("Faking Get %.2f\n"%sleep)
    time.sleep(sleep)
    return { "body": "404 - not found", "response_code": 404, "time": 20 }

@serverboards.rpc_method
def notification_json(**kwargs):
    with open("/tmp/lastmail.json", "w") as fd:
        fd.write(json.dumps(kwargs, indent=2))
    return True

@serverboards.rpc_method
def data_set(k, v):
    serverboards.rpc.call("plugin.data_set", PLUGIN_ID, k, v)
    return True

@serverboards.rpc_method
def data_get(k):
    return serverboards.rpc.call("plugin.data_get", PLUGIN_ID, k)


@serverboards.rpc_method
def periodic_timer(id, period=10):
    period=float(period)
    def tick():
        serverboards.rpc.event("trigger", state="tick", id=id)
    timer_id = serverboards.rpc.add_timer(period, tick)
    return timer_id

@serverboards.rpc_method
def periodic_timer_stop(timer_id):
    serverboards.rpc.remove_timer(timer_id)
    return True

@serverboards.rpc_method
def touchfile(filename="/tmp/auth-py-touched", **_kwargs):
    import datetime
    with open(filename, "w") as fd:
        fd.write(str(datetime.datetime.now()))
    return True

@serverboards.rpc_method
def test_rate_limiting(count):
    for i in range(count):
        serverboards.rpc.event("count_for_rate_limiting", i)
    return "ok"

#print(serverboards.__dir(), file=sys.stderr)
serverboards.loop() # debug=sys.stderr)
