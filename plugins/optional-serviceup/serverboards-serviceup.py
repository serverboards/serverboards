#!/usr/bin/python3

import sys
import os
import gettext
sys.path.append(os.path.join(os.path.dirname(__file__), '../bindings/python/'))
import serverboards_aio as serverboards
from serverboards_aio import print, curio
from pcolor import printc


_ = gettext.gettext
OK_TAGS = ["ok", "up"]


def service_uuid(service):
    return service["uuid"]


@serverboards.cache_ttl(30)
async def recheck_service_by_uuid(service_uuid):
    await serverboards.debug("Service updated", service_uuid)
    service = await serverboards.service.get(service_uuid)
    return await recheck_service(service)


# Use a cache to avoid checking more than one every 30 seconds
# this also avoid that changing the status retriggers the check
@serverboards.cache_ttl(30, hashf=service_uuid)
async def recheck_service(service, *args, **kwargs):
    # print("service is", repr(service))
    status = await get_status_checker(service["type"])
    if not status:
        return
    try:
        tag = await serverboards.plugin.call(
            status["command"], status["call"], [service])
        if not tag:
            tag = "plugin-error"
    except Exception as e:
        await serverboards.error(
            "Error checking service %s: %s" % (service["uuid"], str(e)))
        # serverboards.log_traceback(e)
        tag = "plugin-error"
    fulltag = "status:" + tag
    if fulltag in service["tags"]:
        return
    else:
        await serverboards.info(
            "Service %s changed state to %s"
            % (service["uuid"], tag), service_id=service["uuid"])
        newtags = [x for x in service["tags"] if not x.startswith("status:")]
        newtags.append(fulltag)
        await serverboards.service.update(service["uuid"], {"tags": newtags})
        if tag in OK_TAGS:
            await close_service_issue(service, tag)
        else:
            await open_service_issue(service, tag)


tasks = {}


async def poll_serviceup(seconds, uuid):
    while True:
        await curio.sleep(seconds)
        await recheck_service_by_uuid(uuid)


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
    return status


async def open_service_issue(service, status):
    print("Open issue for ", service["uuid"])
    issue_id = "service_down/%s" % service["uuid"]
    issue = await serverboards.issues.get(issue_id)
    if issue:
        print("Issue already open, not opening again.")
        return

    issue_id2 = "service/%s" % service["uuid"]
    base_url = await get_base_url()
    url = "%s/#/services/%s" % (base_url, service["uuid"])
    description = _("""
Service [%(service)s](%(service_url)s) is %(status)s.

Please check at [Serverboards](%(BASE_URL)s) to fix this status.

* Service: [%(service)s](%(service_url)s)
""") % dict(
        service=service["name"],
        status=status,
        service_url=url,
        BASE_URL=base_url)
    title = _("%(service)s is %(status)s") % dict(
        service=service["name"], status=status)

    # print(description, title)

    await serverboards.issues.create(
        title=title,
        description=description,
        aliases=[issue_id, issue_id2]
    )


async def close_service_issue(service, status):
    print("Close issue for ", service["uuid"])
    issue_id = "service_down/%s" % service["uuid"]
    issue = await serverboards.issues.get(issue_id)
    if not issue or issue["status"] == "closed":
        return None
    base_url = await get_base_url()
    url = "%s/#/services/%s" % (base_url, service["uuid"])
    await serverboards.issues.update(issue_id, [
        {
            "type": "comment",
            "data": _("[%(name)s](%(url)s) is back to %(status)s") % dict(
                name=service["name"], url=url, status=status)},
        {"type": "change_status", "data": "closed"}
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
    await serverboards.rpc.subscribe("service.updated", recheck_service)
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
