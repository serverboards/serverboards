#!/usr/bin/python3

import sys, os, uuid
sys.path.append(os.path.join(os.path.dirname(__file__),'../bindings/python/'))
import serverboards
from serverboards import rpc

@serverboards.rpc_method
def list_actions(serverboard=None, service=None):
    mykeys = rpc.call("plugin.data_items","action.")
    return [x[1] for x in mykeys]

@serverboards.rpc_method
def add_action(action):
    print(action)
    muuid = uuid.uuid4().hex
    action["id"]=muuid
    rpc.call("plugin.data_set", "action."+muuid, action)
    return muuid

@serverboards.rpc_method
def update_action(action):
    rpc.call("plugin.data_set", "action."+action["id"], action)
    return True

serverboards.loop()
