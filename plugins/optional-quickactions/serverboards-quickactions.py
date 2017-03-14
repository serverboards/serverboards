#!/usr/bin/python3

import sys, os, uuid
sys.path.append(os.path.join(os.path.dirname(__file__),'../bindings/python/'))
import serverboards
from serverboards import rpc

service_serverboards_cache={}
def service_in_serverboard(service, serverboard):
    if not service:
        return True
    serverboards = service_serverboards_cache.get(service)
    if not serverboards:
        try:
            serverboards = rpc.call("service.info",service)["serverboards"]
            service_serverboards_cache[service] = serverboards
        except:
            import traceback
            traceback.print_exc()
            serverboards = []
    return serverboard in serverboards

@serverboards.rpc_method
def list_actions(serverboard=None, service=None, star=None):
    items = rpc.call("plugin.data.items","action.")
    items = [x[1] for x in items]
    if star:
        items = [x for x in items if x.get("star")]
    if serverboard:
        items = [x for x in items if service_in_serverboard(x.get("service"), serverboard)]
    return items

@serverboards.rpc_method
def list_actions_select(**kwargs):
    serverboards.debug(kwargs)
    items = rpc.call("plugin.data.items","action.")
    ret = [{"value":k[7:], "name": v["name"]} for k,v in items]
    serverboards.debug(ret)
    return sorted(ret, key=lambda x: x["name"])

@serverboards.rpc_method
def add_action(action):
    print(action)
    muuid = uuid.uuid4().hex
    action["id"]=muuid
    rpc.call("plugin.data.update", "action."+muuid, action)
    return muuid

@serverboards.rpc_method
def update_action(action):
    rpc.call("plugin.data.update", "action."+action["id"], action)
    return True

@serverboards.rpc_method
def run_action(actionid):
    action = rpc.call("plugin.data.get", "action."+actionid)
    serverboards.debug(actionid)
    serverboards.debug(action)
    params = action["params"]
    if action.get("service"):
        service=rpc.call("service.get", action.get("service"))
        params.update(service["config"])
    #print(action["action"], params)
    return rpc.call("action.trigger", action["action"], params)

serverboards.loop()
