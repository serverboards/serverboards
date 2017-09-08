#!/usr/bin/python3

import sys, os, uuid, time, re
sys.path.append(os.path.join(os.path.dirname(__file__),'../bindings/python/'))
import serverboards
from serverboards import rpc, Plugin, print

ssh = Plugin("serverboards.core.ssh/daemon")

def maybe_sudo(service):
    return "sudo " if service["config"].get("sudo") else ""

@serverboards.rpc_method("list")
def _list( service ):
  sudo = maybe_sudo(service)
  lxc_raw = ssh.run(service=service["config"]["server"], command="%slxc-ls -f"%(sudo))["stdout"]
  guests = []
  for l in lxc_raw.split('\n')[1:]:
    l=l.strip().split()
    if l:
      guests.append({
        "id": l[0],
        "name": l[0],
        "state": l[1].lower(),
        "icon": "cloud",
        "descritpion": "LXC container",
        "props":{
          "ip": l[4],
          "ip6": l[5]
        }
      })
  return guests


@serverboards.rpc_method("details")
def details(service, vmc):
  sudo = maybe_sudo(service)
  lxc_raw = ssh.run(service=service["config"]["server"], command="%slxc-info --name %s"%(sudo, vmc))["stdout"]
  props = {}
  prevk = None
  for l in lxc_raw.split('\n'):
      if ':' in l:
        k,v = [x.strip() for x in l.split(':')]
        key = k.lower().replace(' ', '_')
        if l.startswith(' '):
            key=prevk+"."+key
        else:
            prevk=key
        props[key]=v
  return {
    "id": vmc,
    "name": vmc,
    "state": props["state"].lower(),
    "icon": "cloud",
    "descritpion": "LXC Container",
    "props": props
  }

@serverboards.rpc_method
def start( service, vmc ):
  sudo = maybe_sudo(service)
  res = ssh.run(service = service["config"]["server"], command = "%slxc-start --name %s"%(sudo, vmc))["stdout"]
  return res

@serverboards.rpc_method
def stop( service, vmc, force=False ):
  sudo = maybe_sudo(service)
  res = ssh.run(service = service["config"]["server"], command = "%slxc-stop --name %s"%(sudo, vmc))["stdout"]
  return res

@serverboards.rpc_method
def pause( service, vmc, force=False ):
  raise Exception("LXC Cntainers can not be paused.")

if __name__=='__main__':
  serverboards.loop()
