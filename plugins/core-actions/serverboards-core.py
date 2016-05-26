#!/usr/bin/python

import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__),'../bindings/python/'))
import serverboards

@serverboards.rpc_method
def ping(ip=None):
    """
    Performs an ICMP ping to the given IP

    It calls the system ping command.
    """
    import subprocess, re

    if re.match(r"^\d+\.\d+\.\d+\.\d+$", ip):
        output = subprocess.check_output(["ping", ip, "-c", "1", "-W", "1"])
        ms = re.findall(r" time=(\d+\.\d+) ms", output)
        if ms:
            return float(ms[0])
        return False
    raise Exception("Invalid IP")

@serverboards.rpc_method
def http_get(url=None):
    import requests
    ret = requests.get(url)
    sys.stderr.write(repr(ret))
    return {
        "text": ret.text,
        "code": ret.status_code,
        "ms": ret.elapsed.total_seconds()*1000
    }


serverboards.loop(debug=sys.stderr)
