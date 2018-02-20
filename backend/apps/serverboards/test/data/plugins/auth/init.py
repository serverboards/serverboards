#!/usr/bin/python3

import serverboards, time

@serverboards.rpc_method
def init():
    """
    Sleeps one second, wants to be restarted in 30 seconds
    """
    serverboards.info("Init test running")
    time.sleep(0.5)
    serverboards.info("Init test stop")
    return 30

@serverboards.rpc_method
def fail():
    raise Exception("Fail!")

serverboards.loop()
