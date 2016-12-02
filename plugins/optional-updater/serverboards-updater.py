#!/usr/bin/python3

import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__),'../bindings/python/'))
import serverboards
import requests

@serverboards.rpc_method
def latest_version(**args):
    req = requests.get("https://serverboards.io/downloads/latest.json")
    if not req.ok:
        raise Exception("Could not get latest version")
    return req.json()

@serverboards.rpc_method
def update_now(**args):
    serverboards.rpc.reply({"level": "warning", "message": "Serverboards is restarting and should reconnect shortly.\nPage reload is highly encouraged."})
    os.system("sudo apt-get install serverboards")

def test():
    print(repr( latest_version() ))


if __name__=='__main__':
    if len(sys.argv) > 1 and sys.argv[1]=="test":
        test()
    else:
        serverboards.loop()
