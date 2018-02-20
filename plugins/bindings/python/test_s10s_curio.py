#!/usr/bin/python3

import serverboards_aio as serverboards
from serverboards_aio import curio, rpc_method, info


@serverboards.rpc_method
def echo(*params):
    return params


@rpc_method("wait")
async def wait_(timeout):
    await curio.sleep(timeout)
    return timeout


@rpc_method("ping")
async def ping():
    res = await serverboards.call("pong")
    await info("Pong!")
    return res


serverboards.loop()
