#!/usr/bin/python3
import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__),'../bindings/python/'))
import serverboards

import smtplib, email, markdown
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase

settings=None

def find_var_rec(context, var):
    if var in context:
        return context[var]
    return "[UNKNOWN %s]"%var

def template_var_match(context):
    def replace(match):
        from functools import reduce
        ret = reduce(find_var_rec, match.group(1).split('.'), context)
        return ret
    return replace

def render_template(filename, context):
    import re
    with open(filename) as fd:
        return re.sub(r'{{(.*?)}}', template_var_match(context), fd.read())

base_url_cache=None
def base_url():
    global base_url_cache
    if not base_url_cache:
        base_url_cache="http://localhost:8080"
        try:
            base_url_cache=serverboards.rpc.call("settings.get", "serverboards.core.settings/base")["base_url"]
            if base_url_cache.endswith("/"):
                base_url_cache=base_url_cache[0:-1]
        except:
            pass
    return base_url_cache

@serverboards.rpc_method
def send_email(user=None, config=None, message=None, test=False):
    if not settings:
        serverboards.warning("Email not properly configured. Not sending emails")
        return False
    _to = config and config.get("email") or user["email"]
    msg = MIMEMultipart('alternative')
    extra=message["extra"]
    #serverboards.debug("email extra data: %s"%(repr(extra)))

    body_md = message["body"]

    context = {
        "email": _to,
        "user": user,
        "subject": message["subject"],
        "body": markdown.markdown(body_md, safe_mode='escape'),
        "settings": settings,
        "APP_URL": base_url(),
        "type": extra.get("type", "MESSAGE"),
        "url": extra.get("url", base_url())
        }
    body_html = render_template(os.path.join(os.path.dirname(__file__), "email-template.html"), context)

    msg.attach(MIMEText(body_html,"html",'UTF-8'))
    msg.attach(MIMEText(body_md,"plain",'UTF-8'))

    msg["From"]="Serverboards <%s>"%settings["from"]
    msg["To"]=_to
    msg["Subject"]=message["subject"]
    msg["Date"]=email.utils.formatdate()

    if "message_id" in extra:
        msg["Message-Id"] = extra["message_id"]
    if "thread_id" in extra:
        msg["In-Reply-To"] = extra["thread_id"]

    if test:
        with open("/tmp/lastmail.html","w") as fd:
            fd.write(markdown.markdown(body_html, safe_mode='escape'))
        with open("/tmp/lastmail.md","w") as fd:
            fd.write(body_md)

    smtp = smtplib.SMTP(settings["servername"], int(settings["port"] or "0"))
    if settings.get("username") :
        smtp.login(settings["username"], settings["password_pw"])
    smtp.sendmail(settings["from"], _to, msg.as_string())
    smtp.close()

    serverboards.info("Sent email to %s, with subject '%s'"%(user["email"], message["subject"]))

    return True



if len(sys.argv)==2 and sys.argv[1]=="test":
    base_url_cache="http://localhost/"
    settings={
        "servername" : "mail.serverboards.io",
        "port" : "",
        "from" : "test@serverboards.io",
        "username" : "",
        "password_pw" : ""
    }
    print(send_email(
        user={ "email": "dmoreno@serverboards.io" },
        config={},
        message={
            "subject":"This is a test message",
            "body":"Body of the test message\n\nAnother line",
            "extra":{}
        }, test=True))
else:
    try:
        settings=serverboards.rpc.call("settings.get","serverboards.core.notifications/settings.email")
    except:
        settings=None

    serverboards.loop()
