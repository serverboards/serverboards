#!/usr/bin/python3

import sys
import gettext
import serverboards_aio as serverboards
from serverboards_aio import print, curio
from pcolor import printc
_ = gettext.gettext
OK_TAGS = ["ok", "up"]


def service_uuid(service):
    return service["uuid"]


@serverboards.cache_ttl(30)
async def recheck_service_by_uuid(service_uuid):
    service = await serverboards.service.get(service_uuid)
    if 'fields' in service:
        del service['fields']
    await serverboards.debug("Check service up", service_uuid, service)

    return await recheck_service(service)


# Use a cache to avoid checking more than one every 30 seconds
# this also avoid that changing the status retriggers the check
@serverboards.cache_ttl(30, hashf=service_uuid)
async def recheck_service(service, *args, **kwargs):
    """
    Checks if the given service has changed status

    May return a number indicating when to check again
    """
    # First do the real check
    checker = await get_status_checker(service["type"])
    if not checker:
        return
    try:
        status = await serverboards.plugin.call(
            checker["command"], checker["call"], [service])
        if isinstance(status, str):
            status = {
                "status": status,
            }
        if not status:
            status = {
                "status": "plugin-error",
                "message": _('The serviceup checker did not return a valid status')
            }
    except Exception as e:
        serverboards.log_traceback(e, service_id=service["uuid"])
        status = {
            "status": "plugin-error",
            "code": str(e),
            "message": _('The checker itself failed. '
                         'Please contact the developer or file a bug report into Serverboards.'),
        }
    status["checker"] = checker["id"]

    # Then fill some extra data
    tag = status.get("status")
    message = status.get("message")
    if not message:
        if tag in OK_TAGS:
            status["message"] = _('Everything alright.')
        else:
            status["message"] = _('There\'s been some error.')
        message = status["message"]

    # log status. One log per check. A lot but good for diagnosing.
    if tag in OK_TAGS:
        await serverboards.info(
            "Service %s (%s) state is %s: %s"
            % (service["uuid"], service["type"], tag, message), service_id=service["uuid"], **status)
    else:
        await serverboards.error(
            "Service %s (%s) state is %s: %s"
            % (service["uuid"], service["type"], tag, message), service_id=service["uuid"], **status)

    # Now if in different status, update service and open or close issues
    fulltag = "status:" + status.get("status", "unknown")
    if fulltag in service["tags"]:
        return
    else:
        newtags = [x for x in service["tags"] if not x.startswith("status:")]
        newtags.append(fulltag)
        await serverboards.service.update(service["uuid"], {"tags": newtags})
        if tag in OK_TAGS:
            return (await close_service_issue(service, status))
        else:
            return (await open_service_issue(service, status))


async def recheck_service_nocache(*args, **kwargs):
    recheck_service.invalidate_cache()
    return (await recheck_service(*args, **kwargs))


tasks = {}


async def poll_serviceup(seconds, uuid):
    secs = seconds
    while True:
        await curio.sleep(secs)
        secs = seconds
        maybe_secs = await recheck_service_by_uuid(uuid)
        if maybe_secs:  # marked to change next loop, for check two times in a row
            secs = maybe_secs


async def inserted_service(service, *args, **kwargs):
    await recheck_service(service)
    status = await get_status_checker(service["type"])
    if status and status.get("frequency"):
        seconds = time_description_to_seconds(status["frequency"])
        uuid = service["uuid"]
        task_id = await curio.spawn(poll_serviceup, seconds, uuid)
        tasks[uuid] = task_id
        return True
    return False


async def remove_service(service, *args, **kwargs):
    uuid = service["uuid"]
    print("Remove service from periodic checks", uuid)
    tid = tasks.get(uuid)
    if tid:
        await tid.cancel()
        del tasks[uuid]


@serverboards.rpc_method
async def init(*args, **kwargs):
    serverboards.run_async(real_init, result=False)
    return 30 * 60  # call init every 30min, just in case it went down


async def real_init():
    """
    Runs async to avoid timeouts
    """
    if tasks:
        return

    n = e = t = 0
    list = await serverboards.maybe_await(serverboards.service.list())

    print("Checking %d service status" % len(list))

    # Launch all in parallel
    mtasks = []
    for service in list:
        task = await curio.spawn(inserted_service, service)
        mtasks.append(task)

    for task in mtasks:
        t += 1
        try:
            ok = await task.join()
            if ok:
                n += 1
        except Exception as exc:
            import traceback
            traceback.print_exc()
            serverboards.log_traceback(exc)
            e += 1
    await serverboards.info(
        "Service up stats -- UP: %d DOWN: %s NO INFO: %d TOTAL: %d" %
        (n, e, t - (n + e), t))
    if e:
        await serverboards.error(
            "There were errors on %d up service checkers" % e)


@serverboards.cache_ttl(60)
async def get_catalog(type):
    return (await serverboards.plugin.component.catalog(
        type="service", id=type))


@serverboards.cache_ttl(60)
async def get_status_checker(type):
    catalog = await get_catalog(type)
    if not catalog:
        return None
    status = catalog[0].get("extra", {}).get("status")
    if not status:
        return None
    status["id"] = catalog[0]["id"]
    return status


failure_count = set()  # will not open issues, until 2 failures are detected.


async def open_service_issue(service, status):
    service_uuid = service["uuid"]
    if service_uuid not in failure_count:
        failure_count.add(service_uuid)
        await serverboards.debug(
            "The issue will not be opened yet. I will try again in 30 seconds.",
            service_id=service["uuid"]
            )
        return 30  # try again in 30 seconds
    issue_id = "service_down/%s" % service_uuid
    issue = await serverboards.issues.get(issue_id)
    if issue:
        await serverboards.debug(
            "Issue %s already open, not opening again." % issue_id,
            issue_id=issue['id'],
            service_id=service.get('uuid')
        )
        return

    issue_id2 = "service/%s" % service_uuid
    base_url = await get_base_url()
    url = "%s/#/services/%s" % (base_url, service_uuid)
    description = _("""
Service [%(service)s](%(service_url)s) is %(status)s.

%(message)s

Please check at [Serverboards](%(BASE_URL)s) to fix this status.

* Service: [%(service)s](%(service_url)s)
""") % dict(
        service=service["name"],
        status=status["status"],
        service_url=url,
        message=status["message"],
        BASE_URL=base_url)
    title = _("%(service)s: %(status)s") % dict(
        service=service["name"], status=status)

    # print(description, title)

    await serverboards.issues.create(
        title=title,
        description=description,
        aliases=[issue_id, issue_id2]
    )


async def close_service_issue(service, status):
    service_uuid = service["uuid"]
    if service_uuid in failure_count:
        failure_count.remove(service_uuid)
    issue_id = "service_down/%s" % service_uuid
    issue = await serverboards.issues.get(issue_id)
    if not issue or issue["status"] == "closed":
        return None
    base_url = await get_base_url()
    url = "%s/#/services/%s" % (base_url, service_uuid)
    context = {
        "name": service["name"],
        "url": url,
        "status": status["status"],
        "message": status["message"]
    }

    await serverboards.issues.update(issue_id, [
        {
            "type": "comment",
            "data": _("[%(name)s](%(url)s) is back to %(status)s\n\n%(message)s") % context
        }, {
            "type": "change_status",
            "data": "closed"
        }
    ])


@serverboards.cache_ttl(hashf=lambda: True)
async def get_base_url():
    return (await serverboards.settings.get(
        "serverboards.core.settings/base", {})).get("base_url")


td_to_s_multiplier = [
    ("ms", 0.001),
    ("s", 1),
    ("m", 60),
    ("h", 60 * 60),
    ("d", 24 * 60 * 60),
]


def time_description_to_seconds(td):
    if type(td) in (int, float):
        return float(td)
    for sufix, multiplier in td_to_s_multiplier:
        if td.endswith(sufix):
            return float(td[:-len(sufix)]) * multiplier
    return float(td)


async def subscribe_to_services():
    printc("Subscribe to services")
    await serverboards.rpc.subscribe("service.updated", recheck_service_nocache)
    await serverboards.rpc.subscribe("service.inserted", inserted_service)
    await serverboards.rpc.subscribe("service.deleted", remove_service)
    printc("Subscribe to services done")


async def test():
    printc("Testing")
    await init()
    await curio.sleep(3)
    printc("Remove service A", color="green")
    await remove_service({"uuid": "A"})
    await curio.sleep(3)
    printc("Add again service A", color="green")
    await inserted_service({
        "uuid": "A",
        "type": "http",
        "tags": ["status:ok"],
        "name": "Service A"
    })
    await curio.sleep(3)
    sys.exit(0)


if __name__ == '__main__':
    serverboards.run_async(subscribe_to_services, result=False)
    if len(sys.argv) > 1 and sys.argv[1] == 'test':
        import yaml
        printc("test mode")
        data = yaml.load(open("mock.yaml"))
        serverboards.test_mode(test, mock_data=data)
        sys.exit(1)
    # serverboards.set_debug("/tmp/serviceup.log")
    serverboards.loop()
