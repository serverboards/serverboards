#!/usr/bin/python3

import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__),'../bindings/python/'))
import serverboards
import requests, subprocess, yaml, time
from serverboards import Plugin, print

updater = Plugin("serverboards.optional.update/updater", kill_and_restart=True)

@serverboards.rpc_method
def t00_setup_test():
  pass

@serverboards.rpc_method
def t01_get_plugin_list_test():
  catalog = updater.plugin_catalog()
  assert all(x.get("giturl") for x in catalog), catalog
  assert catalog, catalog


@serverboards.rpc_method
def t02_get_service_components_test():
  catalog = updater.component_filter(type="service")
  print(yaml.dump(catalog))
  assert all(x["type"]=="service" for x in catalog)
  assert all(x.get("giturl") for x in catalog), catalog
  assert catalog

  catalog = updater.component_filter(type="service", traits=["sql"])
  print(yaml.dump(catalog))
  assert all(x["traits"]=="sql" for x in catalog)
  assert all(x.get("giturl") for x in catalog), catalog
  assert catalog
  assert len(catalog)==1

serverboards.loop()
