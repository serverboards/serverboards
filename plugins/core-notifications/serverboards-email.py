#!/usr/bin/python
import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__),'../bindings/python/'))
import serverboards

import smtplib
from email.MIMEMultipart import MIMEMultipart
from email.MIMEText import MIMEText
from email.MIMEBase import MIMEBase

settings=None

def render_message(_to, user, message):
    return message["body"]

@serverboards.rpc_method
def send_email(user=None, config=None, message=None):
    assert settings
    _to = config and config.get("email") or user["email"]
    msg = MIMEMultipart('alternative')

    body = message["body"]
    body_html = render_message(_to=_to, user=user, message=message)
    msg.attach(MIMEText(body_html,"html",'UTF-8'))
    msg.attach(MIMEText(body,"plain",'UTF-8'))

    msg["From"]=settings["from"]
    msg["To"]=_to
    msg["Subject"]=message["subject"]

    smtp = smtplib.SMTP(settings["servername"], int(settings["port"] or "0"))
    if settings.get("username") :
        smtp.login(settings["username"], settings["password_pw"])
    smtp.sendmail(settings["from"], _to, msg.as_string())
    smtp.close()

    return True



if len(sys.argv)==2 and sys.argv[1]=="test":
    settings={
        "servername" : "mail.serverboards.io",
        "port" : "",
        "from" : "test@serverboards.io",
        "username" : "",
        "password_pw" : ""
    }
    print send_email(
        user={ "email": "dmoreno@serverboards.io" },
        config={},
        message={
            "subject":"This is a test message",
            "body":"Boy of the test message",
            "extra":[]
        })
else:
    serverboards.rpc.set_debug(open("/tmp/email.log","w"))
    serverboards.rpc.debug( serverboards.rpc.call("dir") )
    settings=serverboards.rpc.call("settings.get","serverboards.core.notifications/settings")

    serverboards.loop()
