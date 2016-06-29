#!/usr/bin/python

import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__),'../bindings/python/'))
import serverboards, requests, random

settings=None
status=None

def tg_url(method):
    return "https://api.telegram.org/bot%s/%s"%(settings["token"], method)

def send_telegram_basic(chat_id, message):
    serverboards.rpc.debug("%d> %s"%(chat_id, message))
    data={
        "chat_id" : chat_id,
        "text" : message,
        "parse_mode" : "Markdown",
    }
    ret = requests.post(tg_url("sendMessage"), data=data).json()
    if not ret["ok"]:
        raise Exception(ret["description"])
    return ret["result"]

@serverboards.rpc_method
def send_telegram(user=None, config=None, message=None):
    send_telegram_basic(
        status["code_to_chatid"][config["code"]],
        ("*%s*\n---\n%s"%(message['subject'], message["body"]))
        )

@serverboards.rpc_method
def info():
    return requests.get(tg_url("getMe")).json()["result"]

@serverboards.rpc_method
def updates(offset=None):
    query={}

    if offset:
        query["offset"]=offset
    return requests.get(tg_url("getUpdates"), params=query).json()["result"]

def check_new_messages():
    update=False
    code_to_chatid=status.get("code_to_chatid",{})
    msgs=updates(status.get("lastid"))
    for msg in msgs:
        serverboards.rpc.debug(msg)
        update=True
        if "message" in msg:
            chatid=msg["message"]["chat"]["id"]
            if not chatid in code_to_chatid.values():
                code=''.join(random.choice("012345789ABCDEF") for x in range(6))
                try:
                    send_telegram_basic(
                        chatid,
                        "Welcome to the Serverboards Bot. Please use this code at your notification settings: *%s*"%code)
                except:
                    import traceback; traceback.print_exc()
                code_to_chatid[code]=chatid
        status["lastid"]=max(status["lastid"], msg["update_id"]+1)
    if not msgs:
        serverboards.rpc.debug("No new messages")
    status["code_to_chatid"]=code_to_chatid

    return update

serverboards.rpc.set_debug(sys.stderr)

if __name__=="__main__":
    if len(sys.argv)==2 and sys.argv[1]=="test":
        settings={
            "token" : "208790212:AAEI4qvKA__vDmPk_9kmkn4wtOsoE9LF4Yg"
        }
        status={
            "lastid": 213604781,
            "code_to_chatid": {
                "297ECC": 239499457
            }
        }

        check_new_messages()
        print status

        print send_telegram(
            user={ "email": "dmoreno@serverboards.io" },
            config={
                "code": "297ECC"
            },
            message={
                "subject":"This is a test message",
                "body":"Body of the test message",
                "extra":[]
            })

    else:
        serverboards.rpc.debug("1")
        settings=serverboards.rpc.call("settings.get", "serverboards.core.notifications/settings.telegram")
        serverboards.rpc.debug("setting %s"%settings)
        status=serverboards.rpc.call("plugin.data_get", "serverboards.core.notifications/telegram", "status")
        serverboards.rpc.debug("status %s"%status)

        if check_new_messages():
            serverboards.rpc.call("plugin.data_set", "serverboards.core.notifications/telegram", "status", status)
        serverboards.rpc.debug("3")

        serverboards.loop()
