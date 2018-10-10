#!/usr/bin/python3

import sys
import os
import requests
import subprocess
import yaml
import time
import urllib
import gzip
import sh
sys.path.append(os.path.join(os.path.dirname(__file__), '../bindings/python/'))
from serverboards import print, settings
import serverboards

PLUGINS_YAML_URL = "https://serverboards.io/downloads/plugins.yaml.gz"


@serverboards.rpc_method
def latest_version(**args):
    req = requests.get("https://serverboards.io/downloads/latest.json")
    if not req.ok:
        raise Exception("Could not get latest version")
    return req.json()


@serverboards.rpc_method
def update_now(action_id=None, **args):
    if action_id:
        serverboards.rpc.call(
            "action.update", action_id, {
                "label": """Serverboards is updating.
It may restart but should reconnect shortly.
Page reload is highly encouraged."""
            })
    sh.sudo(
        "-n",
        "./serverboards-updater.sh",
        _out=serverboards.info,
        _err=serverboards.error)
    return True


def test():
    # print(repr( latest_version() ))
    # print(repr(check_plugin_updates()))
    # print(repr(check_plugin_updates()))
    pass


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        test()
    else:
        serverboards.loop()
