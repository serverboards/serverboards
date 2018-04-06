#!/usr/bin/python3
import sys
import os
import smtplib
import email
import markdown
import yaml
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
sys.path.append(os.path.join(os.path.dirname(__file__), '../bindings/python/'))
from serverboards_aio import print
import serverboards_aio as serverboards

email_utils = email.utils

settings = {}


def find_var_rec(context, var):
    if not context:
        return ''
    if var in context:
        return context[var]
    return ''


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


async def base_url():
    base_url_ = "http://localhost:8080"
    try:
        base_url_ = await serverboards.rpc.call(
            "settings.get", "serverboards.core.settings/base")["base_url"]
        if base_url_.endswith("/"):
            base_url_ = base_url_[0:-1]
    except Exception:
        pass
    return base_url_


@serverboards.rpc_method
async def send_email(user=None, config=None, message=None, **extra):
    if not settings:
        await serverboards.warning(
            "Email not properly configured. Not sending emails")
        return False
    _to = config and config.get("email") or user["email"]
    extra = {k: v
             for k, v in message["extra"].items()
             if k not in ['email', 'subject', 'body']}
    extra["user"] = user
    # serverboards.debug("email extra data: %s"%(repr(extra)))
    return await send_email_action(
        _to,
        message["subject"],
        message["body"],
        **extra)


@serverboards.rpc_method
async def send_email_action(email=None, subject=None, body=None, **extra):
    if not settings:
        await update_settings()
    msg = MIMEMultipart('alternative')
    # serverboards.debug("email extra data: %s"%(repr(extra)))

    base_url = settings["base_url"]
    context = {
        "email": email,
        "user": extra.get("user"),
        "subject": subject,
        "body": markdown.markdown(body, safe_mode='escape'),
        "settings": settings,
        "APP_URL": base_url,
        "type": extra.get("type", "MESSAGE"),
        "url": extra.get("url", base_url)
    }
    body_html = render_template(
        os.path.join(os.path.dirname(__file__),
                     "email-template.html"),
        context)

    msg.attach(MIMEText(body, "plain", 'UTF-8'))
    msg.attach(MIMEText(body_html, "html", 'UTF-8'))

    msg["From"] = "Serverboards <%s>" % settings["from"]
    msg["To"] = email
    msg["Subject"] = subject
    msg["Date"] = email_utils.formatdate()

    if "message_id" in extra:
        msg["Message-Id"] = extra["message_id"]
    if "thread_id" in extra:
        msg["In-Reply-To"] = extra["thread_id"]

    if extra.get("test"):
        with open("/tmp/lastmail.html", "w") as fd:
            fd.write(markdown.markdown(body_html, safe_mode='escape'))
        with open("/tmp/lastmail.md", "w") as fd:
            fd.write(body)

    port = settings.get("port")
    ssl = settings.get("ssl")

    def send_sync(port):
        if port or ssl:
            if port == '465' or ssl:
                port = port or '465'
                smtp = smtplib.SMTP_SSL(settings["servername"], int(port))
            else:
                smtp = smtplib.SMTP(settings["servername"], int(port))
        else:
            smtp = smtplib.SMTP(settings["servername"])
        if settings.get("username"):
            smtp.login(settings.get("username"), settings.get("password_pw"))
        smtp.sendmail(settings["from"], email, msg.as_string())
        smtp.close()

    await serverboards.sync(send_sync, port)

    await serverboards.info(
        "Sent email to %s, with subject '%s'" % (email, subject)
    )

    return {
        "sent": True
    }


def test():
    async def test_async():
        print("Start debug")
        global settings
        settings = yaml.load(open("config.yaml"))
        # {
        #     "servername" : "mail.serverboards.io",
        #     "port" : "",
        #     "from" : "test@serverboards.io",
        #     "username" : "",
        #     "password_pw" : ""
        # }
        sea = await send_email_action(
            "dmoreno@coralbits.com",
            "This is a test from s10s test",
            "The body of the test",
            message_id="s10s_test@serverboards.io",
        )
        print("email action", sea)
        assert sea == {"sent": True}

        se = await send_email(
            user={"email": "dmoreno@serverboards.io"},
            config={},
            message={
                "subject": "This is a test message",
                "body": "Body of the test message\n\nAnother line",
                "extra": {}
            },
            test=True,
            message_id="s10s_test@serverboards.io",
        )
        print("email to user", se)
        assert se

        print("Done")
        await serverboards.curio.sleep(2)
        sys.exit(0)

    serverboards.test_mode(test_async)


async def update_settings():
    global settings
    try:
        settings_ = await serverboards.rpc.call(
            "settings.get",
            "serverboards.core.notifications/settings.email")
        settings.update(settings_)
        settings["base_url"] = await base_url()
    except Exception:
        settings = {
            "servername": "localhost",
            "port": "",
            "ssl": False,
            "from": "noreply@localhost",
            "username": "",
            "password_pw": ""
        }


def main():
    serverboards.async(update_settings, result=False)
    serverboards.loop()


if len(sys.argv) == 2 and sys.argv[1] == "--test":
    test()
else:
    main()
