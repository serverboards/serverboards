#!/usr/bin/python3

import sys, os, uuid, time, re
sys.path.append(os.path.join(os.path.dirname(__file__),'../bindings/python/'))
import serverboards
from serverboards import service, plugin, print, Plugin

catalog = None
def get_catalog():
  global catalog
  if not catalog:
    catalog = plugin.component.catalog(type="vmc")
  return catalog

def get_cloud_services_from(project):
  return service.list(traits="core.cloud.compute", project=project)

def get_provider(s):
  stype=s["type"]
  for p in get_catalog():
    extra = p.get("extra",{})
    if extra.get("for") == stype:
      return Plugin(extra.get("command"))
  return None

@serverboards.rpc_method
def list(project=None):
  l = []
  for s in get_cloud_services_from(project):
    p = get_provider( s )
    type = s["type"]
    if p:
      try:
        for x in p.list( s ):
          x["type"]=type
          l.append(x)
      except Exception as e:
        print(s)
        serverboards.error("Error listing nodes from %s / %s: %s"%(s["uuid"], s["name"], str(e)))

  print("List", l)
  return l

serverboards.loop()
