#!/usr/bin/python
from __future__ import print_function
import serverboards, sys, time, json

PLUGIN_ID="serverboards.test.auth"

@serverboards.rpc_method
def auth(type="fake", token=None):
    if token=="XXX":
        return 'dmoreno@serverboards.io'
    return False

@serverboards.rpc_method
def ping(*args):
    return 'pong'

@serverboards.rpc_method
def abort(*args):
    sys.stderr.write("Pretend to work\n")
    time.sleep(0.500)
    sys.stderr.write("Aborting\n")
    sys.exit(1)

@serverboards.rpc_method
def bad_protocol(*args):
    sys.stdout.write("Invalid message\n")
    return True

@serverboards.rpc_method
def http_get(url=None, sleep=0.100):
    sys.stderr.write("Faking Get\n")
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
def periodic_timer(period=10):
    period=float(period)
    serverboards.rpc.reply("ok")
    while True:
        time.sleep(period)
        serverboards.rpc.event("trigger", state="tick")

@serverboards.rpc_method
def touchfile(filename="/tmp/auth-py-touched"):
    import datetime
    with open(filename, "w") as fd:
        fd.write(str(datetime.datetime.now()))
    return True

#print(serverboards.__dir(), file=sys.stderr)
serverboards.loop() #debug=sys.stderr)
