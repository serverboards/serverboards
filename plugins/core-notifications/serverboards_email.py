#!/usr/bin/python
import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__),'../bindings/python/'))
import serverboards

import smtplib
from email.MIMEMultipart import MIMEMultipart
from email.MIMEText import MIMEText
from email.MIMEBase import MIMEBase

settings=None

def find_var_rec(context, var):
    if var in context:
        return context[var]
    return "[UNKNOWN %s]"%var

def template_var_match(context):
    def replace(match):
        ret = reduce(find_var_rec, match.group(1).split('.'), context)
        return ret
    return replace

def render_template(filename, context):
    import re
    with open(filename) as fd:
        return re.sub(r'{{(.*?)}}', template_var_match(context), fd.read())

def base_url():
    url="http://localhost:8080"
    try:
        url=serverboards.rpc.call("settings.get", "serverboards.core.settings/base")["base_url"]
    except:
        pass
    return url

@serverboards.rpc_method
def send_email(user=None, config=None, message=None, extra={}, test=False):
    if not settings:
        return False
    _to = config and config.get("email") or user["email"]
    msg = MIMEMultipart('alternative')

    body = message["body"]

    context = {
        "email": _to,
        "user": user,
        "subject": message["subject"],
        "body": message["body"].replace("<", "&lt;").replace(">","&gt;").replace("\n\n","</p><p>"),
        "settings": settings,
        "APP_URL": "http://localhost:8080" if test else base_url(),
        "type": extra.get("type", "MESSAGE")
        }
    body_html = render_template(os.path.join(os.path.dirname(__file__), "email-template.html"), context)

    msg.attach(MIMEText(body_html,"html",'UTF-8'))
    msg.attach(MIMEText(body,"plain",'UTF-8'))

    msg["From"]=settings["from"]
    msg["To"]=_to
    msg["Subject"]=message["subject"]

    if test:
        with open("/tmp/lastmail.html","w") as fd:
            fd.write(body_html)

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
            "body":"Body of the test message\n\nAnother line",
            "extra":[]
        }, test=True)
else:
    try:
        settings=serverboards.rpc.call("settings.get","serverboards.core.notifications/settings.email")
    except:
        settings=None

    serverboards.loop()
