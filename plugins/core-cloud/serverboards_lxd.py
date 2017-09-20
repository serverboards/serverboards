#!/usr/bin/python3

import sys, os, json
sys.path.append(os.path.join(os.path.dirname(__file__),'../bindings/python/'))
import serverboards
from serverboards import rpc, Plugin, print

ssh = Plugin("serverboards.core.ssh/daemon")

def maybe_sudo(service):
    return ["sudo"] if service["config"].get("sudo") else []

def details_(node, extra=False):
    extra_info={}
    if extra:
        extra_info={
            "state": node["state"] or {},
            "config": {**node["config"], **node["expanded_config"]},
            "ephemeral": node.get("ephemeral"),
            }

    return {
        "name": node.get("name"),
        "state": (node.get("status") or "stopped").lower(),
        "icon" : "cloud",
        "description" : None,
        "id" : node.get("name"),
        "props" : {
            **extra_info
        }
    }

@serverboards.rpc_method
def list(service):
    sudo = maybe_sudo(service)
    json_data = ssh.run(service=service["config"]["server"], command=[*sudo, "lxc", "ls", "--format=json"])["stdout"]
    data = json.loads(json_data)
    ret = []
    for node in data:
        ret.append( details_(node, extra=False) )
    return ret

@serverboards.rpc_method
def details(service, vmc):
    sudo = maybe_sudo(service)
    json_data = ssh.run(service=service["config"]["server"], command=[*sudo,"lxc","list","--format=json",vmc])["stdout"]
    data = json.loads(json_data)[0]

    return details_(data, extra=True)

@serverboards.rpc_method
def start(service, vmc):
    sudo = maybe_sudo(service)
    try:
        ssh.run(service=service["config"]["server"], command=[*sudo, "lxc", "start", vmc] )
    except:
        import traceback
        traceback.print_exc()
        return False
    return True

@serverboards.rpc_method
def stop(service, vmc, force=False):
    sudo = maybe_sudo(service)
    try:
        ssh.run(service=service["config"]["server"], command=[*sudo, "lxc", "stop", vmc] )
    except:
        import traceback
        traceback.print_exc()
        return False
    return True

serverboards.loop()
