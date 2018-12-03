#!/usr/bin/python3

import serverboards
import time


@serverboards.rpc_method
def init():
    """
    Sleeps one second, wants to be restarted in one second
    """
    serverboards.info("Init test running")
    time.sleep(0.5)
    serverboards.info("Init test stop. Restart in 2 secs.")
    return 2


@serverboards.rpc_method
def fail():
    time.sleep(1)
    raise Exception("Fail!")


serverboards.loop()
