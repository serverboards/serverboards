#!/usr/bin/python3

import sys, os, uuid, time, re
sys.path.append(os.path.join(os.path.dirname(__file__),'../bindings/python/'))
import serverboards
from serverboards import rpc, cache_ttl, print
from libcloud.compute.types import Provider
from libcloud.compute.providers import get_driver

GiB = 1024 * 1024 * 1024
MiB = 1024 * 1024

connections = {} # UUID of a service to a connection

state_trans = {
  "terminated" : "stopped",
}

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

def xml_to_json(root):
    ret = {}
    if root.attrib:
        ret.update(root.attrib)
    for child in root:
        ret.update( xml_to_json(child) )
    if not ret:
        ret = root.text
    return {root.tag: ret}

def make_connection(config):
    type = config.get("type")
    if type == 'libvirt':
        return LibVirt(config)
    if type == 'digitalocean':
        return DigitalOcean(config)
    if type == 'aws.ec2':
        return AWSEC2(config)
    raise Exception("Could not create connexion to remote cloud provider")

class Connection:
  def __init__(self, type, driver):
    self.driver = driver
    self.type = type

  def describe(self, node):
    return None

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

  def details(self, node, extra_info=False):
    extra = {
        'private_ips':node.private_ips,
        'public_ips':node.public_ips,
        'created_at':str(node.created_at),
        'mem_total':node.extra.get("used_memory"),
    }
    if extra_info:
        extra.update(node.extra)
        extra["size"]=node.size
        try:
            extra["image"]=self.driver.get_image(extra["image_id"]).extra
        except:
            extra["image"]=node.image

        try:
            extra["disk_total"] = extra["image"]["block_device_mapping"][0]["ebs"]["volume_size"] * 1024 # from GiB to MiB
        except:
            pass

        extra = ensure_jsonable(extra)

    return {
      "name" : node.name,
      "description" : self.describe(node),
      "id" : node.uuid,
      "state" : state_trans.get(node.state, node.state),
      "icon" : self.guess_icon(node),
      "props" : extra
    }



class LibVirt(Connection):
    def __init__(self, config):
      type = config.get("type")
      cls=get_driver(Provider.LIBVIRT)

      ssh_server = serverboards.service.get(config['server'])
      keyfile=os.path.join(os.environ["HOME"],"../serverboards.core.ssh/id_rsa")
      url=ssh_server["config"]['url']
      if url.startswith('ssh://'):
          url=url[6:]
      url="qemu+ssh://%s/system?keyfile=%s"%(url, keyfile)

      #serverboards.debug("Connect to libvirt // %s"%url)
      driver=cls( url )
      super().__init__("libvirt", driver)

      self.prev_used_cpu_time_v={}
      self.prev_used_cpu_time_t={}

    def details(self, node, extra_info=False):
        details = super().details(node, extra_info)

        if extra_info:
            extra = details["props"]

            used_cpu_time=extra.get("used_cpu_time")
            if used_cpu_time:
                used_cpu_time/=1_000_000_000;
                now=time.time()
                if node.uuid in self.prev_used_cpu_time_v:
                    extra["CPU_rt"]=(used_cpu_time-self.prev_used_cpu_time_v[node.uuid])/(now-self.prev_used_cpu_time_t[node.uuid])
                self.prev_used_cpu_time_t[node.uuid]=now
                self.prev_used_cpu_time_v[node.uuid]=used_cpu_time


            lnode = self.get_libvirt_node(node)
            if details["state"]=="running":
                extra["private_ips"], extra["public_ips"] = self.get_ips(lnode)
            extra["disk_total"], extra["disk_free_rt"] = self.get_disk_total_free(lnode)

            import xml.etree.ElementTree as ET

            xmlo = ET.fromstring( lnode.XMLDesc() )
            extra.update( xml_to_json( xmlo ) )

            if details["state"]=="running":
                try:
                    graphics=extra["domain"]["devices"]["graphics"]
                    if graphics["type"]=="spice":
                        extra["spice_port"]=graphics["port"]
                except:
                    # no graphics
                    pass

        return details

    def get_libvirt_node(self, node):
        return next(x for x in self.driver.connection.listAllDomains() if x.name() == node.name)

    def get_ips(self, lnode):
        private_ips, public_ips = [], []
        for iface, data in lnode.interfaceAddresses(0).items():
            for addr in data["addrs"]:
                ip = addr["addr"]
                if is_public_ip(ip):
                    public_ips.append(ip)
                else:
                    private_ips.append(ip)
        return private_ips, public_ips

    def get_disk_total_free(self, lnode):
        try:
            total, used, _physical = lnode.blockInfo("vda")
            return (total / MiB, used / MiB)
        except:
            return None, None

class DigitalOcean(Connection):
    def __init__(self, config):
      cls=get_driver(Provider.DIGITAL_OCEAN)
      driver=cls(config['token'], api_version='v2')
      super().__init__("digitalocean", driver)

class AWSEC2(Connection):
    def __init__(self, config):
      cls=get_driver(Provider.EC2)
      driver=cls(config["access_key"], config["access_secret"], region=config["region"])
      super().__init__("aws.ec2", driver)


@cache_ttl(60)
def get_connection(service):
  conn = connections.get(service["uuid"], None)
  if conn:
    return conn

  conn = make_connection( service["config"] )
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


@serverboards.rpc_method("details")
def _details(service, vmc):
  conn = get_connection(service)
  return conn.details(conn.get_node(vmc), True)

@serverboards.rpc_method("list")
def _list(service):
  print("Get list from libvirt", service)
  conn = get_connection(service)

  return [conn.details(node) for node in conn.driver.list_nodes()]

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
