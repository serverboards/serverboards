#!/usr/bin/python3
import sys
import os
import json
sys.path.append(os.path.join(os.path.dirname(__file__), '../bindings/python/'))
from serverboards_aio import print, settings
import serverboards_aio as serverboards
import curio
import curio.subprocess


@serverboards.rpc_method
async def search(*args, **kwargs):
    terms = list(args) + ["%s:%s" % x for x in kwargs.items() if not x[0].startswith('-')]
    await serverboards.debug("Searching for components with: %s" % terms)

    cmd = ["s10s", "plugin", "search", "--format=json", *terms]
    result = await curio.subprocess.check_output(cmd)

    return json.loads(result)


@serverboards.rpc_method
async def install(plugin_id):
    try:
        res = await curio.subprocess.check_output(["s10s", "plugin", "install", "--format=json", plugin_id])
    except curio.subprocess.CalledProcessError as e:
        print(e.output)
        raise

    return json.loads(res)


@serverboards.rpc_method
async def userdata():
    return {
        "name": "David Moreno",
        "email": "dmoreno@serverboards.io",
    }


async def test():
    print(await search(type="screen"))


if __name__ == "__main__":
    if len(sys.argv) > 1:
        serverboards.test_mode(test, {})

    serverboards.loop()
