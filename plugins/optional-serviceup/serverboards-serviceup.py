#!/usr/bin/python3

import sys, os, uuid
sys.path.append(os.path.join(os.path.dirname(__file__),'../bindings/python/'))
import serverboards
from serverboards import print
import gettext
_=gettext.gettext
sys.stderr=serverboards.error

OK_TAGS=["ok","up"]

def service_uuid(service):
    return service["uuid"]

@serverboards.cache_ttl(30)
def recheck_service_by_uuid(service_uuid):
    service = serverboards.service.get(service_uuid)
    return recheck_service(service)

# Use a cache to avoid checking more than one every 30 seconds
# this also avoid that changing the status retriggers the check
@serverboards.cache_ttl(30, hashf=service_uuid)
def recheck_service(service, *args, **kwargs):
    status = get_status_checker(service["type"])
    if not status:
        return
    try:
        tag = status["plugin"].call(status["call"], service)
    except:
        tag = "plugin-error"
    fulltag="status:"+tag
    if fulltag in service["tags"]:
        return
    else:
        serverboards.info("Service %s changed state to %s"%(service["uuid"], tag), service_id=service["uuid"])
        newtags = [x for x in service["tags"] if not x.startswith("status:")]
        newtags.append(fulltag)
        serverboards.service.update(service["uuid"], {"tags": newtags})
        if tag in OK_TAGS:
            close_service_issue(service, tag)
        else:
            open_service_issue(service, tag)


timers = {}
def inserted_service(service, *args, **kwargs):
    recheck_service(service)
    status = get_status_checker(service["type"])
    if status and status.get("frequency"):
        seconds = time_description_to_seconds(status["frequency"])
        timer_id = serverboards.rpc.add_timer(seconds, lambda: recheck_service_by_uuid(service["uuid"]), rearm = True )
        timers[service["uuid"]]=timer_id
        return True
    return False

def remove_service(service, *args, **kwargs):
    print("Remove service from periodic checks", service["uuid"])
    tid = timers.get(service["uuid"])
    if tid:
        serverboards.rpc.remove_timer(tid)
        del timers[service["uuid"]]

@serverboards.rpc_method
def init(*args, **kwargs):
    if timers:
        return
    for t in timers.values():
        serverboards.rpc.remove_timer(t)
    timers.clear()
    n=e=t=0
    for service in serverboards.service.list():
        t+=1
        try:
            ok = inserted_service(service)
            if ok:
                n+=1
        except:
            import traceback; traceback.print_exc()
            e+=1
    serverboards.info("Checked %d+%d/%d services for is up"%(n,e,t))
    if e:
        serverboards.error("There were errors on %d up service checkers"%e)

    return 30*60 # call init every 30min, just in case it went down

@serverboards.cache_ttl(60)
def get_status_checker(type):
    catalog = serverboards.plugin.component.catalog(type="service", id=type)
    if not catalog:
        return None
    status = catalog[0].get("extra",{}).get("status")
    if not status:
        return None
    # decorate to keep at cache and reuse as required.
    status["plugin"]=serverboards.Plugin(status["command"])
    return status

def open_service_issue(service, status):
    print("open issue for ", service)
    issue_id = "service_down/%s"%service["uuid"]
    issue = serverboards.issues.get(issue_id)
    if issue:
        print("Issue already open, not opening again.")
        return

    issue_id2 = "service/%s"%service["uuid"]
    base_url = get_base_url()
    url="%s/#/services/%s"%(base_url, service["uuid"])
    description=_("""
Service [%(service)s](%(service_url)s) is %(status)s.

Please check at [Serverboards](%(BASE_URL)s) to fix this status.

* Service: [%(service)s](%(service_url)s)
""")%dict(service=service["name"], status=status, service_url=url, BASE_URL=base_url)
    title=_("%(service)s is %(status)s")%dict(service=service["name"], status=status)

    serverboards.issues.create(title=title, description=description, aliases=[issue_id, issue_id2])

def close_service_issue(service, status):
    print("close issue for ", service)
    issue_id = "service_down/%s"%service["uuid"]
    issue = serverboards.issues.get(issue_id)
    if not issue or issue["status"] == "closed":
        return None
    url="%s/#/services/%s"%(get_base_url(), service["uuid"])
    serverboards.issues.update(issue_id, [
        {"type":"comment", "data": _("[%(name)s](%(url)s) is back to %(status)s")%dict(name=service["name"], url=url, status=status)},
        {"type": "change_status", "data": "closed"}
    ])

@serverboards.cache_ttl(hashf=lambda: True)
def get_base_url():
    return serverboards.settings.get("serverboards.core.settings/base", {}).get("base_url")

td_to_s_multiplier=[
    ("ms", 0.001),
    ("s", 1),
    ("m", 60),
    ("h", 60*60),
    ("d", 24*60*60),
]

def time_description_to_seconds(td):
    if type(td) in (int, float):
        return float(td)
    for sufix, multiplier in td_to_s_multiplier:
        if td.endswith(sufix):
            return float(td[:-len(sufix)])*multiplier
    return float(td)

serverboards.rpc.subscribe("service.updated", recheck_service)
serverboards.rpc.subscribe("service.inserted", inserted_service)
serverboards.rpc.subscribe("service.deleted", remove_service)

if __name__=='__main__':
    serverboards.loop()
