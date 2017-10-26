#!/usr/bin/python3

import sys, os, json
sys.path.append(os.path.join(os.path.dirname(__file__),'../bindings/python/'))
import serverboards
from serverboards import rpc, Plugin, print

PRIVATE_IP_MASKS=[
    "192.168.",
    "10.",
    "127.",
    "172.16."
]

def is_public_ip(ip):
    for test in PRIVATE_IP_MASKS:
        if ip.startswith(test):
            return False
    return True

def xpath(data, *q):
    if not q:
        return [data]
    if not data:
        return []
    head = q[0]
    rest = q[1:]
    if head == "*":
        print(type(data), type(data)==list, list, data)
        if type(data) == list:
            v = data
        else:
            v = data.values()
        return [
            f
            for i in v
            for f in xpath(i, *rest)
        ]
    else:
        try:
            return [*xpath(data[head], *rest)]
        except Exception as e:
            rpc.log_traceback(e)
            return []


LOCALS = ["127.0", "fc00::"]

def is_localhost(ip):
    for i in LOCALS:
        if ip.startswith(i):
            return True
    return False

ssh = Plugin("serverboards.core.ssh/daemon")

def maybe_sudo(service):
    return ["sudo"] if service["config"].get("sudo") else []

def details_(node, extra=False):
    extra_info={}
    if extra:
        ips = [
            ip
            for ip in xpath(node, "state", "network", "*", "addresses", "*", "address")
            if not is_localhost(ip)
            ]
        extra_info={
            "state": node["state"] or {},
            "config": {**node["config"], **node["expanded_config"]},
            "ephemeral": node.get("ephemeral"),
            'private_ips': [ip for ip in ips if not is_public_ip(ip)],
            'public_ips': [ip for ip in ips if is_public_ip(ip)],
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

@serverboards.rpc_method("list")
def list_(service):
    sudo = maybe_sudo(service)
    json_data = ssh.run(service=service["config"]["server"], command=[*sudo, "lxc", "list", "--format=json"])["stdout"]
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
