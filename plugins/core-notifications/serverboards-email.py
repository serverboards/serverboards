import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__),'../bindings/python/'))
import serverboards

import smtplib

config={}

def render_message(_to, user, message):
    return message["body"]

@serverboards.rpc_method
def send_email(user=None, config=None, message=None):
    _to = config.get("email") or user["email"]
    msg = MIMEMultipart('alternative')

    body = message["body"]
    body_html = render_message(_to=_to, user=user, message=message)
    msg.attach(MIMEText(body_html,"plain",'UTF-8'))
    msg.attach(MIMEText(body,"html",'UTF-8'))

    msg["From"]=config["from"]
    msg["To"]=_to
    msg["Subject"]=message["subject"]

    smtp = smtplib(config["servername"], int(config["port"] or "0"))
    if config["username"]:
        smtp.login(config["username"], config["password_pw"])
    smtp.sendmail(config["from"], _to, msg)
    smtp.close()


serverboards.loop()
