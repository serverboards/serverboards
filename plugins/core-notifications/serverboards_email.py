#!/usr/bin/python3
import sys
import os
import smtplib
import email
import markdown
import yaml
import jinja2
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
sys.path.append(os.path.join(os.path.dirname(__file__), '../bindings/python/'))
from serverboards_aio import print
import serverboards_aio as serverboards

email_utils = email.utils
settings = {}


@serverboards.cache_ttl(600)
def get_template(filename):
    with open(filename, 'rt') as fd:
        return jinja2.Template(fd.read())


async def render_template(filename, context):
    template = await get_template(filename)
    return template.render(context)


@serverboards.rpc_method
async def base_url():
    base_url_ = "http://localhost:8080"
    try:
        settings = await serverboards.rpc.call(
            "settings.get", "serverboards.core.settings/base")
        if settings:
            base_url_ = settings["base_url"]
            while base_url_.endswith("/"):
                base_url_ = base_url_[0:-1]
    except Exception as e:
        serverboards.log_traceback(e)
        pass
    return base_url_


@serverboards.rpc_method
async def send_email(user=None, config=None, message=None, **extra):
    if not settings:
        await update_settings()
    if not settings:
        await serverboards.warning(
            "Email not properly configured. Not sending emails: ", message["subject"])
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
    if not settings.get("servername"):
        await serverboards.warning(
            "No email server configured. Not sending emails.")
        return {
            "sent": False
        }
    msg = MIMEMultipart('alternative')
    # await serverboards.debug("email extra data: %s"%(repr(extra)))

    base_url = settings["base_url"]
    context = {
        "email": email,
        "user": extra.get("user"),
        "subject": subject,
        "body": markdown.markdown(body, safe_mode='escape'),
        "settings": settings,
        "APP_URL": base_url,
        "type": extra.get("type", "MESSAGE"),
        "url": extra.get("url", None)
    }
    body_html = await render_template(
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
        msg["Message-Id"] = "<%s>" % extra["message_id"]
    if "reply_to" in extra:
        msg["In-Reply-To"] = "<%s>" % extra["reply_to"]
    if "thread_id" in extra:
        msg["References"] = "<%s>" % extra["thread_id"]

    if extra.get("test"):
        with open("/tmp/lastmail.html", "w") as fd:
            fd.write(markdown.markdown(body_html, safe_mode='escape'))
        with open("/tmp/lastmail.md", "w") as fd:
            fd.write(body)

    def send_sync():
        port = settings.get("port")
        ssl = settings.get("ssl")
        if port or ssl:
            if port == '465' or ssl:
                port = port or '465'
                smtp = smtplib.SMTP_SSL(settings["servername"], int(port))
            else:
                smtp = smtplib.SMTP(settings["servername"], int(port))
        else:
            smtp = smtplib.SMTP(settings["servername"])
        if settings.get("username"):
            print("Login as ", repr(settings))
            smtp.login(settings.get("username"), settings.get("password_pw"))
        smtp.sendmail(settings["from"], email, msg.as_string())
        smtp.close()

    await serverboards.sync(send_sync)

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
    await serverboards.debug("Get email settings.")
    global settings
    try:
        settings_ = await serverboards.rpc.call(
            "settings.get",
            "serverboards.core.notifications/settings.email")
        settings.update(settings_)
        settings["base_url"] = await base_url()
    except Exception as e:
        serverboards.log_traceback(e)
        settings = {}


def main():
    serverboards.async(update_settings, result=False)
    serverboards.loop()


if len(sys.argv) == 2 and sys.argv[1] == "--test":
    test()
else:
    main()
