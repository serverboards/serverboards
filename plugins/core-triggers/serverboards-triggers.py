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

uuid_to_timer={}

def time_description_to_seconds(td):
    if type(td) in (int, float):
        return float(td)
    for sufix, multiplier in td_to_s_multiplier:
        if td.endswith(sufix):
            return float(td[:-len(sufix)])*multiplier
    return float(td)

class TimerCheck:
    def __init__(self, id, check, type, frequency, grace):
        if id in uuid_to_timer:
            raise Exception("Trigger id already registered")
        self.id=id
        self.check=check
        self.type=type
        self.frequency=time_description_to_seconds(frequency)
        self.grace=time_description_to_seconds(grace)
        self.mgrace=self.grace
        self.is_up=True
        self.timer_id=serverboards.rpc.add_timer(self.frequency, self.tick)
        uuid_to_timer[id]=self

    def tick(self):
        check_result=self.check()
        serverboards.rpc.debug("Check result[%s]: %s"%(self.id, check_result))
        if self.is_up:
            if not check_result:
                self.mgrace-=self.frequency
            else:
                self.mgrace=self.grace

            if self.mgrace<=0:
                serverboards.rpc.event("trigger", {"type": self.type, "id": self.id, "state" : "down"})
                self.is_up=False
        else:
            if check_result:
                serverboards.rpc.event("trigger", {"type": self.type, "id": self.id, "state" : "up"})
                self.is_up=True
                self.mgrace=self.grace

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

def real_socket_up(url=None):
    purl=urlparse.urlparse(url)
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
def ping(id, ip=None, frequency=30, grace=60):
    TimerCheck(id, lambda: real_ping(ip), "ping", frequency, grace)
    return id

@serverboards.rpc_method
def http(id, url=None, maxs=1, frequency=30, grace=60):
    maxs=float(maxs)
    TimerCheck(id, lambda: real_http(url) <= maxs, "http", frequency, grace)
    return id

@serverboards.rpc_method
def socket_is_up(id, url=None, frequency=30, grace=60):
    TimerCheck(id, lambda: real_socket_up(url), "socket_is_up", frequency, grace)
    return id

@serverboards.rpc_method
def stop_trigger(id):
    timer=uuid_to_timer[id]
    serverboards.rpc.remove_timer(timer.timer_id)
    del uuid_to_timer[id]
    return True

@serverboards.rpc_method
def periodic(timeout=None):
    serverboards.rpc.reply("ok")

    s=time_description_to_seconds(timeout)
    while True:
        time.sleep(s)
        serverboards.rpc.event("trigger", {"type": "periodic", "state" : "tick"})

serverboards.loop()
