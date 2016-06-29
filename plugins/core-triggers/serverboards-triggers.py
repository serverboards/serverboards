#!/usr/bin/python

import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__),'../bindings/python/'))
import serverboards, time, subprocess, re, requests

td_to_s_multiplier=[
    ("ms", 0.001),
    ("s", 1),
    ("m", 60),
    ("h", 60*60),
    ("d", 24*60*60),
]

def time_description_to_seconds(td):
    for sufix, multiplier in td_to_s_multiplier:
        if td.endswith(sufix):
            return float(td[:-len(sufix)])*multiplier
    return float(td)

def real_ping(ip):
    try:
        output = subprocess.check_output(["ping", ip, "-c", "1", "-W", "1"])
    except subprocess.CalledProcessError:
        return False
    ms = re.findall(r" time=(\d+\.\d+) ms", output)
    if ms:
        return float(ms[0])
    return False

def real_http(url=None):
    try:
        ret = requests.get(url)
        serverboards.rpc.log("Http get %.2f s"%ret.elapsed.total_seconds())
        return ret.elapsed.total_seconds()
    except:
        return 99999 # ~7 days.. to mark timeout for sure

@serverboards.rpc_method
def ping(ip=None, frequency=30, grace=60):
    serverboards.rpc.reply("ok")

    frequency=float(frequency)
    grace=float(grace)
    response_limit(lambda: real_ping(ip), "ping", frequency, grace)

@serverboards.rpc_method
def http(url=None, maxs=1, frequency=30, grace=60):
    serverboards.rpc.reply("ok")

    frequency=float(frequency)
    grace=float(grace)
    maxs=float(maxs)
    response_limit(lambda: real_http(url) <= maxs, "http", frequency, grace)

def response_limit(check, type, frequency, grace):
    mgrace=grace
    is_up=True
    while True:
        if is_up:
            if not check():
                mgrace-=frequency
            else:
                mgrace=grace

            if mgrace<=0:
                serverboards.rpc.event("trigger", {"type": type, "state" : "down"})
                is_up=False
        else:
            if check():
                serverboards.rpc.event("trigger", {"type": type, "state" : "up"})
                is_up=True
                mgrace=grace
        time.sleep(frequency)

@serverboards.rpc_method
def periodic(timeout=None):
    serverboards.rpc.reply("ok")

    s=time_description_to_seconds(timeout)
    while True:
        time.sleep(s)
        serverboards.rpc.event("trigger", {"type": "periodic", "state" : "tick"})

serverboards.loop()
