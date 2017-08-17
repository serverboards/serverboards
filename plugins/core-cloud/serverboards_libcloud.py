#!/usr/bin/python3

import sys, os, uuid, time, re
sys.path.append(os.path.join(os.path.dirname(__file__),'../bindings/python/'))
import serverboards
from serverboards import rpc, cache_ttl
from libcloud.compute.types import Provider
from libcloud.compute.providers import get_driver

connections = {} # UUID of a service to a connection

state_trans = {
  "terminated" : "stopped",
}

class Connection:
  def __init__(self, config):
    type = config["type"]
    driver = None
    if type == 'libvirt':
      cls=get_driver(Provider.LIBVIRT)

      ssh_server = serverboards.service.get(config['server'])
      keyfile=os.path.join(os.environ["HOME"],"../serverboards.core.ssh/id_rsa")
      url="qemu+ssh://%s/system?keyfile=%s"%(ssh_server["config"]['url'], keyfile)

      #serverboards.debug("Connect to libvirt // %s"%url)
      driver=cls( url )
    elif type == 'digitalocean':
      cls=get_driver(Provider.DIGITAL_OCEAN)
      driver=cls(config['token'], api_version='v2')
    if not driver:
      raise Exception("Could not create connexion to remote cloud provider")
    self.driver = driver
    self.type = type

  def describe(self, node):
    return "%s node"%(self.type)

  def guess_icon(self, node):
    nodename=node.name.lower()
    if 'debian' in nodename:
        return 'debian.svg'
    if 'fedora' in nodename:
        return 'fedora.svg'
    if 'ubuntu' in nodename:
        return 'ubuntu.svg'
    if 'linux' in nodename:
        return 'linux'
    return None

@cache_ttl(60)
def get_connection(service):
  conn = connections.get(service["uuid"], None)
  if conn:
    return conn

  conn = Connection( service["config"] )
  connections[service["uuid"]] = conn
  return conn

def details(conn, node, extra_info=False, ):
  return {
    "name" : node.name,
    "description" : conn.describe(node),
    "id" : node.uuid,
    "state" : state_trans.get(node.state, node.state),
    "icon" : conn.guess_icon(node),
    "props" : {
        'private_ips':node.private_ips,
        'public_ips':node.public_ips,
        'created_at':str(node.created_at),
    }
  }

@serverboards.rpc_method("details")
def _details(service, vmc):
  conn = get_connection(service)
  return details(conn, conn.driver.ex_get_node_by_uuid(vmc), True)

@serverboards.rpc_method("list")
def _list(service):
  conn = get_connection(service)

  return [details(conn, node) for node in conn.driver.list_nodes()]

@serverboards.rpc_method
def start(service, vmc):
  conn = get_connection(service)
  try:
    conn.driver.ex_start_node( conn.driver.ex_get_node_by_uuid(vmc) )
  except Exception as e:
    if "already running" in str(e):
      return False # already running
  return True

@serverboards.rpc_method
def stop(service, vmc, force = False):
  conn = get_connection(service)
  driver=conn.driver
  if conn.type == 'libvirt':
      n = driver.connection.lookupByUUIDString(vmc)
      n.destroy()
      return True
  return driver.ex_stop_node( driver.ex_get_node_by_uuid(vmc) )

@serverboards.rpc_method
def pause(service, vmc):
  conn = get_connection(service)
  pass

def printy( data ):
  import yaml
  print( yaml.dump( data ) )


if __name__=='__main__':
  serverboards.loop()
