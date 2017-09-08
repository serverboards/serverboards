#!/usr/bin/python3

import sys, os, uuid, time, re
sys.path.append(os.path.join(os.path.dirname(__file__),'../bindings/python/'))
import serverboards
from serverboards import rpc, cache_ttl, print
from libcloud.compute.types import Provider
from libcloud.compute.providers import get_driver

connections = {} # UUID of a service to a connection

state_trans = {
  "terminated" : "stopped",
}

class Connection:
  def __init__(self, config):
    type = config.get("type")
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
    elif type == 'aws.ec2':
      cls=get_driver(Provider.EC2)
      driver=cls(config["access_key"], config["access_secret"], region=config["region"])
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

  def get_node(self, uuid):
      if hasattr(self.driver, "ex_get_node_by_uuid"):
        return self.driver.ex_get_node_by_uuid(uuid)
      else:
        nodes = self.driver.list_nodes()
        return next(x for x in nodes if x.uuid == uuid)

@cache_ttl(60)
def get_connection(service):
  conn = connections.get(service["uuid"], None)
  if conn:
    return conn

  conn = Connection( service["config"] )
  connections[service["uuid"]] = conn
  return conn

def ensure_jsonable(data):
    if isinstance(data, (str, int, float)):
        return data
    if isinstance(data, list):
        return [ensure_jsonable(x) for x in data]
    if isinstance(data, dict):
        return {k:ensure_jsonable(v) for k,v  in data.items()}
    try:
        return str(data)
    except:
        return repr(data)

def details(conn, node, extra_info=False, ):
  extra = {}
  if extra_info:
      extra=node.extra
      extra["size"]=node.size
      extra["image"]=node.image
      extra = ensure_jsonable(extra)

  print("Extra data", extra)

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
        **extra
    }
  }

@serverboards.rpc_method("details")
def _details(service, vmc):
  conn = get_connection(service)
  return details(conn, conn.get_node(vmc), True)

@serverboards.rpc_method("list")
def _list(service):
  conn = get_connection(service)

  return [details(conn, node) for node in conn.driver.list_nodes()]

@serverboards.rpc_method
def start(service, vmc):
  conn = get_connection(service)
  try:
    node = conn.get_node(vmc)
    conn.driver.ex_start_node( node  )
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
  return driver.ex_stop_node( conn.get_node(vmc) )

@serverboards.rpc_method
def pause(service, vmc):
  conn = get_connection(service)
  pass

def printy( data ):
  import yaml
  print( yaml.dump( data ) )


if __name__=='__main__':
  serverboards.loop()
