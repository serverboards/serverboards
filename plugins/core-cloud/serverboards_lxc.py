#!/usr/bin/python3

import sys, os, uuid, time, re
sys.path.append(os.path.join(os.path.dirname(__file__),'../bindings/python/'))
import serverboards
from serverboards import rpc, Plugin

ssh = Plugin("serverboards.core.ssh/daemon")

@serverboards.rpc_method("list")
def _list( service ):
  lxc_raw = ssh.run(service["service"], ["lxc-ls","-f"])
  guests = []
  for l in lxc_raw.split('\n')[1:]:
    l=l.split()
    guests.append({
      "id": l[0],
      "name": l[1],
      "state": l[1].lower(),
      "icon": "cloud",
      "descritpion": "LXC container"
      "config":{
        "ip": l[4],
        "ip6": l[5]
      }
    })

@serverboards.rpc_method
def start( service, vmc ):
  res = ssh.run(service["service"], ["lxc-start", "--name", vmc])
  return res

@serverboards.rpc_method
def stop( service, vmc, force=False ):
  res = ssh.run(service["service"], ["lxc-stop", "--name", vmc])
  return res

if __name__=='__main__':
  serverboards.loop()
