#!/usr/bin/python3
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
sys.stdin = open(os.path.join(os.path.dirname(__file__), 'test.json'))
import serverboards_aio as serverboards
from serverboards_aio import curio, rpc_method, info, service, debug


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
    ser = await service.get(uuid="XXX")
    await debug("Got service?", ser)
    return res


serverboards.loop()
