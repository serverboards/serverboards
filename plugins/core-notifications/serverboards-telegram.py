#!/usr/bin/python

import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__),'../bindings/python/'))
import serverboards, requests

settings=None

email_to_id={
    "dmoreno@serverboards.io" : 239499457
}

def tg_url(method):
    return "https://api.telegram.org/bot%s/%s"%(settings["token"], method)

@serverboards.rpc_method
def send_telegram(user=None, config=None, message=None):
    data={
        "chat_id" : email_to_id[user["email"]],
        "text" : ("*%s*\n---\n%s"%(message['subject'], message["body"])),
        "parse_mode" : "Markdown",
    }
    ret = requests.post(tg_url("sendMessage"), data=data).json()
    if not ret["ok"]:
        raise Exception(ret["description"])
    return ret["result"]

@serverboards.rpc_method
def info():
    return requests.get(tg_url("getMe")).json()["result"]

@serverboards.rpc_method
def updates(offset=None):
    query={}

    if offset:
        query["offset"]=offset
    return requests.get(tg_url("getUpdates"), params=query).json()["result"]


if len(sys.argv)==2 and sys.argv[1]=="test":
    settings={
        "token" : "208790212:AAEI4qvKA__vDmPk_9kmkn4wtOsoE9LF4Yg"
    }
    print updates()

    print send_telegram(
        user={ "email": "dmoreno@serverboards.io" },
        config={
        },
        message={
            "subject":"This is a test message",
            "body":"Body of the test message",
            "extra":[]
        })

else:
    settings=serverboards.rpc.call("settings.get","serverboards.core.notifications/settings.telegram")

    serverboards.loop()
