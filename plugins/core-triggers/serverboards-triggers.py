#!/usr/bin/python

import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__),'../bindings/python/'))
import serverboards, time, subprocess, re, requests
import socket, urlparse

td_to_s_multiplier=[
    ("ms", 0.001),
    ("s", 1),
    ("m", 60),
    ("h", 60*60),
    ("d", 24*60*60),
]

def time_description_to_seconds(td):
    if type(td) in (int, float):
        return float(td)
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
        return False

def real_socket_up(uri=None):
    purl=urlparse.urlparse(uri)
    host=purl.hostname
    port=purl.port or str(purl.scheme)
    #serverboards.rpc.debug("<%s> <%s> %s"%(host, type(port), repr(purl)))

    initt=time.time()
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(5)
    try:
        for address in socket.getaddrinfo(host, port):
            #serverboards.rpc.debug("<%s>"%(repr(address)))
            try:
                result = sock.connect_ex( address[4] )
                if result == 0:
                    return time.time() - initt
            except (IOError, TypeError):
                pass # normally no IPv6 support
        return False
    except:
        import traceback
        traceback.print_exc()
        return False

@serverboards.rpc_method
def ping(ip=None, frequency=30, grace=60):
    serverboards.rpc.reply("ok")

    response_limit(lambda: real_ping(ip), "ping", frequency, grace)

@serverboards.rpc_method
def http(url=None, maxs=1, frequency=30, grace=60):
    serverboards.rpc.reply("ok")

    maxs=float(maxs)
    response_limit(lambda: real_http(url) <= maxs, "http", frequency, grace)

@serverboards.rpc_method
def socket_is_up(uri=None, frequency=30, grace=60):
    serverboards.rpc.reply("ok")

    response_limit(lambda: real_socket_up(uri), "socket_is_up", frequency, grace)

def response_limit(check, type, frequency, grace):
    frequency=time_description_to_seconds(frequency)
    grace=time_description_to_seconds(grace)
    mgrace=grace
    is_up=True
    while True:
        check_result=check()
        serverboards.rpc.debug("Check result: %s"%check_result)
        if is_up:
            if not check_result:
                mgrace-=frequency
            else:
                mgrace=grace

            if mgrace<=0:
                serverboards.rpc.event("trigger", {"type": type, "state" : "down"})
                is_up=False
        else:
            if check_result:
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

serverboards.loop(debug=True)
