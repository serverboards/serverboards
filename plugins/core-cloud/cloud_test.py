#!/usr/bin/python3

import sys, os, uuid, time, re, yaml
sys.path.append(os.path.join(os.path.dirname(__file__),'../bindings/python/'))
import serverboards
from serverboards import rpc, service, print, Plugin

service_ssh, service_libvirt = None, None

cloud = Plugin("serverboards.core.cloud/daemon")

@serverboards.rpc_method
def t00_setup_test():
  global service_ssh, service_libvirt
  service_ssh = service.create(
    name = "ssh localhost",
    type = "serverboards.core.ssh/server",
    config = {
      "url": "localhost",
      "options": "",
      }
    )
  service_libvirt = service.create(
    name = "libvirt",
    type = "serverboards.core.cloud/libvirt",
    config = {
      "type":"libvirt",
      "server": service_ssh
      }
    )

@serverboards.rpc_method
def t01_list_nodes_test():
  l = cloud.list( service_libvirt )
  print("Listed nodes from localhost libvirt: %s"%l)


@serverboards.rpc_method
def t99_cleanup_services_test():
  service.delete(service_ssh)
  service.delete(service_libvirt)

serverboards.loop()
