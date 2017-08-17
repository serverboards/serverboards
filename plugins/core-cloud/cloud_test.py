#!/usr/bin/python3

import sys, os, uuid, time, re, yaml
sys.path.append(os.path.join(os.path.dirname(__file__),'../bindings/python/'))
import serverboards
from serverboards import rpc, service, project, print, plugin, Plugin

service_ssh, service_libvirt = None, None
me = os.environ["USER"]

cloud = None

@serverboards.rpc_method
def t00_setup_test():
  global cloud
  try: plugin.kill("serverboards.core.cloud/daemon")
  except: pass
  try: plugin.kill("serverboards.core.ssh/daemon")
  except: pass
  cloud = Plugin("serverboards.core.cloud/daemon")

  global service_ssh, service_libvirt
  project.create(
    shortname="TCLOUD",
    name="Test Cloud"
  )
  service_ssh = service.create(
    name = "ssh localhost",
    type = "serverboards.core.ssh/ssh",
    config = {
      "url": "%s@localhost"%me,
      "options": "",
      },
    project = "TCLOUD",
    )
  service_libvirt = service.create(
    name = "libvirt",
    type = "serverboards.core.cloud/libvirt",
    config = {
      "type":"libvirt",
      "server": service_ssh
      },
    project = "TCLOUD",
    )
  service_lxc = service.create(
    name = "lxc",
    type = "serverboards.core.cloud/lxc",
    config = {
      "server": service_ssh,
      "sudo": True,
      },
    project = "TCLOUD",
    )
  service.attach("TCLOUD", service_libvirt)
  service.attach("TCLOUD", service_ssh)
  service.attach("TCLOUD", service_lxc)

  ssh_public_key = Plugin("serverboards.core.ssh/mgmt").ssh_public_key()
  authorized_keys_path = "/home/%s/.ssh/authorized_keys"%os.environ["USER"]
  if ssh_public_key not in open(authorized_keys_path,"r").read():
    with open(authorized_keys_path, "a") as wd:
      serverboards.debug("Adding the SSH key to curent user keys, will try to connect using ssh")
      wd.write("%s\n"%ssh_public_key)

first_node = None
@serverboards.rpc_method
def t01_list_nodes_test():
  global first_node

  l = cloud.list( project="TCLOUD" )
  print("Listed nodes from localhost libvirt: %s"%l)
  assert l != [], str(l)
  first_node = l[0]
  assert [x for x in l if x["type"] == "serverboards.core.cloud/libvirt"]
  assert [x for x in l if x["type"] == "serverboards.core.cloud/lxc"]

@serverboards.rpc_method
def t02_start_node_test():
  assert first_node
  ok = cloud.start(first_node["parent"], first_node["id"])
  print( yaml.dump(cloud.details(first_node["parent"], first_node["id"])) )

@serverboards.rpc_method
def t03_pause_node_test():
  assert first_node
  ok = cloud.pause(first_node["parent"], first_node["id"])
  print( yaml.dump(cloud.details(first_node["parent"], first_node["id"])) )

@serverboards.rpc_method
def t04_stop_node_test():
  assert first_node
  ok = cloud.call('stop', service=first_node["parent"], vmc=first_node["id"])
  print( yaml.dump(cloud.details(first_node["parent"], first_node["id"])) )

@serverboards.rpc_method
def t99_cleanup_services_test():
  service.delete(service_ssh)
  service.delete(service_libvirt)
  project.delete("TCLOUD")

serverboards.loop()
