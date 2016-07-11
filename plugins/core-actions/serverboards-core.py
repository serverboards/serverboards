#!/usr/bin/python

import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__),'../bindings/python/'))
import serverboards
import requests
import subprocess, re

@serverboards.rpc_method
def ping(ip=None, url=None):
    """
    Performs an ping to the given IP / URL

    It calls the system ping command.
    """
    if ip:
        if re.match(r"^\d+\.\d+\.\d+\.\d+$", ip):
            output = subprocess.check_output(["ping", ip, "-c", "1", "-W", "1"])
            ms = re.findall(r" time=(\d+\.\d+) ms", output)
            if ms:
                return { "ms" : float(ms[0]) }
            return False
        raise Exception("Invalid IP")
    elif url:
        return { "ms": http_get(url)["ms"] }
    raise Exception("Invalid ping type")

@serverboards.rpc_method
def http_get(url=None):
    ret = requests.get(url)
    return {
        #"text": ret.text,
        "code": ret.status_code,
        "ms": ret.elapsed.total_seconds()*1000
    }

serverboards.loop(debug=sys.stderr)