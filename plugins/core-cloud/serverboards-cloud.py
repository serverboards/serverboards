#!/usr/bin/python3

import sys, os, uuid, time, re, yaml
sys.path.append(os.path.join(os.path.dirname(__file__),'../bindings/python/'))
import serverboards
from serverboards import service, plugin, print, Plugin, cache_ttl

@cache_ttl(600)
def get_catalog():
  return plugin.component.catalog(type="vmc")

@cache_ttl(60)
def get_cloud_services_from(project):
  if project:
    return service.list(traits="core.cloud.compute", project=project)
  else:
    return service.list(traits="core.cloud.compute")


@cache_ttl(60)
def get_provider(s):
  stype=s["type"]
  for p in get_catalog():
    extra = p.get("extra",{})
    if extra.get("for") == stype:
      return Plugin(extra.get("command"))
  return None

@cache_ttl(60)
def get_service(uuid):
  return service.get(uuid)

@cache_ttl(60)
def get_provider_by_uuid(uuid):
  s = get_service(uuid)
  return get_provider(s)

@serverboards.rpc_method("list")
@cache_ttl(10)
def list(project=None):
  l = []
  for s in get_cloud_services_from(project):
    p = get_provider( s )
    type = s["type"]
    suuid = s["uuid"]
    if p:
      try:
        for x in p.list( s ):
          x["type"]=type
          x["parent"]=suuid
          l.append(x)
      except Exception as e:
        serverboards.error("Error listing nodes from %s / %s: %s"%(s["uuid"], s["name"], str(e)))

  return l

@serverboards.rpc_method
def start(parent, node):
  p = get_provider_by_uuid( parent )

  ret = p.start( get_service(parent), node )
  list.invalidate_cache()

  return ret

@serverboards.rpc_method
def stop(service=None, vmc=None, force = False):
  assert service and vmc
  p = get_provider_by_uuid( service )

  ret = p.call("stop", service=get_service(service), vmc=vmc, force=force )
  list.invalidate_cache()

  return ret

@serverboards.rpc_method
def pause(parent, node):
  p = get_provider_by_uuid( parent )

  ret = p.pause( get_service(parent), node )
  list.invalidate_cache()

  return ret


@serverboards.rpc_method
def details(parent, node):
  p = get_provider_by_uuid( parent )
  ret = p.details( get_service(parent), node )
  return ret


serverboards.loop()
