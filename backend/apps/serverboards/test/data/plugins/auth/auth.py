#!/usr/bin/python3
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
        "email": username,
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
    serverboards.rpc.call("plugin.data.update", PLUGIN_ID, k, v)
    return True

@serverboards.rpc_method
def data_get(k):
    return serverboards.rpc.call("plugin.data.get", PLUGIN_ID, k)

@serverboards.rpc_method
def data_sets(k, v):
    serverboards.rpc.call("plugin.data.update", k, v)
    return True

@serverboards.rpc_method
def data_gets(k):
    return serverboards.rpc.call("plugin.data.get", k)

@serverboards.rpc_method
def data_sete(k, v):
    serverboards.rpc.call("plugin.data.update", "bad_plugin_id", k, v)
    return True

@serverboards.rpc_method
def data_gete(k):
    return serverboards.rpc.call("plugin.data.get", "bad_plugin_id", k)


@serverboards.rpc_method
def periodic_timer(id, period=10):
    period=float(period)
    count = 0
    def tick():
        nonlocal count
        count+=1
        state = { "state" : "tick", "count": count }
        serverboards.rpc.event("trigger", **state, id=id)
    timer_id = serverboards.rpc.add_timer(period, tick)
    return timer_id

@serverboards.rpc_method
def periodic_timer_stop(timer_id):
    serverboards.info("Stopping periodic timer %s"%(timer_id))
    serverboards.rpc.remove_timer(timer_id)
    return True


start_triggers=set([])
@serverboards.rpc_method
def trigger_at_start(id):
    serverboards.debug(repr(("add",start_triggers, id)))
    assert not id in start_triggers
    start_triggers.add(id)
    serverboards.info("Just triggers a tick at start: %s"%id)
    serverboards.rpc.event("trigger", state="tick", id=id)
    return id

@serverboards.rpc_method
def stop_trigger_at_start(id):
    serverboards.debug(repr(("del",start_triggers, id)))
    assert id in start_triggers
    start_triggers.remove(id)
    serverboards.info("Stop start trigger: %s"%id)
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

@serverboards.rpc_method
def server_updated(service):
    serverboards.info("From plugin: Updating '%s' service"%service["name"], extra=dict(service=service))
    serverboards.rpc.event("event.emit", "test.service.updated", {"ok" : True} )

serverboards.rpc.subscribe("service.updated[serverboards.test.auth/server]", server_updated)

#print(serverboards.__dir(), file=sys.stderr)
serverboards.loop() # debug=sys.stderr)
