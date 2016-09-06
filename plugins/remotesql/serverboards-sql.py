#!/usr/bin/python
import sys, os
import serverboards

@serverboards.rpc_method
def uname():
    try:
        with open("/etc/hostname") as hostname:
            return hostname.read().strip()
    except:
        return None

serverboards.loop()
