#!/usr/bin/python3
import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__),'../bindings/python/'))
import serverboards
from serverboards import print, Plugin

ssh = Plugin("serverboards.core.ssh/daemon")

@serverboards.rpc_method
def csv_schema(config, table=None):
    print(config, table)
    if not table:
        res = ssh.run(config["service"], ["ls", "-1", config["config"]["path"]])
        print(res)
        return []
    return {}

if __name__=='__main__':
    serverboards.loop()
