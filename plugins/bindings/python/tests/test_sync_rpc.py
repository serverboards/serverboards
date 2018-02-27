#!/usr/bin/python3

import serverboards
from serverboards import rpc_method, rpc


@rpc_method
def test1():
    print("Test1, call test2")
    ret = rpc.call("test2")
    print("Test1 result", ret)
    return ret


@rpc_method
def test3():
    print("Test3, ok")
    return "kool"


serverboards.rpc.set_debug()
serverboards.loop()
