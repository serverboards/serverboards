#!/usr/bin/python3

import sys, os, uuid, time, re
sys.path.append(os.path.join(os.path.dirname(__file__),'../bindings/python/'))
import serverboards
from serverboards import rpc, Plugin, print

ssh = Plugin("serverboards.core.ssh/daemon")

@serverboards.rpc_method("list")
def _list( service ):
  sudo = "sudo " if service["config"].get("sudo") else ""
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
  sudo = "sudo " if service["config"].get("sudo") else ""
  lxc_raw = ssh.run(service=service["config"]["server"], command="%slxc-info --name %s"%(sudo))["stdout"]
  props = {}
  for l in lxc_raw.split('\n'):
    k,v = [x.strip() for x in l.split(':')]
    props[k.lower().replace(' ', '_')]=v
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
  res = ssh.run(service["service"], ["lxc-start", "--name", vmc])
  return res

@serverboards.rpc_method
def stop( service, vmc, force=False ):
  res = ssh.run(service["service"], ["lxc-stop", "--name", vmc])
  return res

@serverboards.rpc_method
def pause( service, vmc, force=False ):
  raise Exception("LXC Cntainers can not be paused.")

if __name__=='__main__':
  serverboards.loop()
