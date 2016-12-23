#!/usr/bin/python3

import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__),'../bindings/python/'))
import serverboards
import requests, subprocess, re, socket, time
from urllib.parse import urlparse

@serverboards.rpc_method
def ping(ip=None, url=None):
    """
    Performs an ping to the given IP / URL

    It calls the system ping command.
    """
    if ip:
        try:
            output = subprocess.check_output(["ping", ip, "-c", "1", "-W", "1"])
        except:
            return False
        ms = re.findall(r" time=(\d+\.\d+) ms", output)
        if ms:
            return { "ms" : float(ms[0]) }
        return False
    elif url.startswith("http://") or url.startswith("https://") or url.startswith("ftp://") :
        res = http_get(url)
        return { "ms": res["ms"], "description" :  "Response code: %s"%(res["code"]) }
    elif '://' in url:
        res = socket_connect(url)
        return { "ms": res["ms"], "description" :  "Socket connection time." }

    raise Exception("Invalid ping type")

@serverboards.rpc_method
def socket_connect(url=None):
    purl=urlparse(url)
    host=purl.hostname
    port=purl.port or str(purl.scheme)
    #serverboards.rpc.debug("<%s> <%s> %s"%(host, type(port), repr(purl)))

    initt=time.time()
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    except:
        return False
    sock.settimeout(5)
    for address in socket.getaddrinfo(host, port):
        #serverboards.rpc.debug("<%s>"%(repr(address)))
        try:
            result = sock.connect_ex( address[4] )
            if result == 0:
                return { "ms" : 1000.0 * (time.time() - initt) }
        except (IOError, TypeError):
            pass # as it tries all resolutions, normally is no IPv6 supported

    raise Exception("Could not connect")

@serverboards.rpc_method
def http_get(url=None):
    try:
        ret = requests.get(url)
    except:
        import traceback; traceback.print_exc()
        raise Exception("Cant get resource")
    return {
        #"text": ret.text,
        "code": ret.status_code,
        "ms": ret.elapsed.total_seconds()*1000
    }

@serverboards.rpc_method
def set_tags(service=None, tags=None):
    #serverboards.rpc.debug("service %s"%repr(service))
    service_tags = service["tags"] or []
    orig_tags=service_tags[:]
    if tags is None:
        tags=''
    for i in tags.replace(",", " ").split(" "):
        if not i:
            continue
        if i[0]=='-':
            if i[1:] in service_tags:
                service_tags.remove(i[1:])
        elif i[0]=='+':
            if i[1:] in service_tags:
                service_tags.append(i[1:])
        elif not i in service_tags: # default append
            service_tags.append(i)
    if service_tags != orig_tags:
        serverboards.rpc.call("service.update", service["uuid"], { "tags": service_tags })

def base_url():
    url="http://localhost:8080"
    try:
        url=serverboards.rpc.call("settings.get", "serverboards.core.settings/base")["base_url"]
    except:
        pass
    return url

@serverboards.rpc_method
def send_notification(email, subject, body, service=None, **extra):
    if service:
        if service["serverboards"]:
            serverboard=service["serverboards"][0]
            service["url"] = "%s/#/serverboard/%s/services"%(base_url(), serverboard)
        extra["service"] = service

    serverboards.rpc.call("notifications.notify", email=email, subject=subject, body=body, extra=extra)


@serverboards.rpc_method
def open_issue(**data):
    from templating import render
    import json
    title=render(data.get("title"), data)
    description=render(data.get("description"), data)
    aliases=render(data.get("aliases"), data).split()
    #serverboards.rpc.info(json.dumps(data, indent=2))

    serverboards.rpc.call("issues.add", title=title, description=description, aliases=aliases)

@serverboards.rpc_method
def close_issue(issue=None, **data):
    from templating import render
    import json
    issue=render(issue, data)
    comment=render(data.get("comment"), data)
    #serverboards.rpc.info(json.dumps(data, indent=2))
    if not issue:
        serverboards.error("Error trying to close issue, none given")

    title=comment.split("\n")[0]
    try:
        serverboards.rpc.call("issues.update", issue, {"type": "comment", "title": title, "data": {"comment": comment}})
        serverboards.rpc.call("issues.update", issue, {"type": "change_status", "title": "Closed issue", "data": {"status": "closed"}})
    except:
        serverboards.error("Error trying to close issue, cant update issue")

@serverboards.rpc_method
def comment_issue(issue=None, **data):
    from templating import render
    import json
    issue=render(issue, data)
    comment=render(data.get("comment"), data)
    #serverboards.rpc.info(json.dumps(data, indent=2))
    if not issue:
        serverboards.error("Error trying to close issue, none given")

    title=comment.split("\n")[0]
    try:
        serverboards.rpc.call("issues.update", issue, {"type": "comment", "title": title, "data": {"comment": comment}})
    except:
        serverboards.error("Error trying to close issue, cant update issue")



serverboards.loop() #debug=sys.stderr)
