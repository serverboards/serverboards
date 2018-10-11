#!/usr/bin/python3
import sys
import json
from serverboards_aio import print, settings
import serverboards_aio as serverboards
import curio
import curio.subprocess


@serverboards.rpc_method
async def search(*args, **kwargs):
    terms = list(args) + ["%s:%s" % x for x in kwargs.items() if not x[0].startswith('-')]
    await serverboards.debug("Searching for components with: %s" % terms)

    cmd = ["s10s", "plugin", "search", "--format=json", *terms, "--fields=base,icon,icon64"]
    print(cmd)
    result = await curio.subprocess.check_output(cmd)

    return json.loads(result)


@serverboards.rpc_method
async def install(plugin_id):
    try:
        res = await curio.subprocess.check_output(["s10s", "plugin", "install", "--format=json", plugin_id])
    except curio.subprocess.CalledProcessError as e:
        print(e.output)
        raise

    return json.loads(res)


@serverboards.rpc_method
async def account():
    try:
        res = await curio.subprocess.check_output(["s10s", "plugin", "account", "--format=json"])
    except curio.subprocess.CalledProcessError as e:
        print(e.output)
        raise

    return json.loads(res)


@serverboards.rpc_method
async def logout():
    try:
        res = await curio.subprocess.check_output(["s10s", "plugin", "logout", "--format=json"])
    except curio.subprocess.CalledProcessError as e:
        print(e.output)
        raise

    return json.loads(res)


@serverboards.rpc_method
async def login(email, password):
    try:
        res = await curio.subprocess.check_output(
            ["s10s", "plugin", "login", email, password, "--format=json"],
            stdin=None
        )
    except curio.subprocess.CalledProcessError as e:
        print(e.output)
        raise

    return json.loads(res)


@serverboards.rpc_method
async def check_updates(*plugins):
    """
    Checks for updates. If no plugins passed, checks them all.
    """
    try:
        await curio.subprocess.check_output(["s10s", "plugin", "check", *plugins, "--format=json"])
        res = await curio.subprocess.check_output(["s10s", "plugin", "list", "--format=json"])
        res = json.loads(res)
        if plugins:  # Not the most efficient. But works. Might be fixed with a "plugin info" command.
            res = [x for x in res if x["id"] in plugins]
    except curio.subprocess.CalledProcessError as e:
        print(e.output)
        raise

    return res


@serverboards.rpc_method
async def update(plugin_id, action_id=None):
    try:
        res = await curio.subprocess.check_output(["s10s", "plugin", "update", plugin_id, "--format=json"])
    except curio.subprocess.CalledProcessError as e:
        print(e.output)
        raise

    return json.loads(res)


@serverboards.rpc_method
async def remove(plugin_id, action_id=None):
    try:
        res = await curio.subprocess.check_output(["s10s", "plugin", "remove", plugin_id, "--format=json"])
    except curio.subprocess.CalledProcessError as e:
        print(e.output)
        raise

    return json.loads(res)


@serverboards.rpc_method
async def enable(plugin_id, action_id=None, enabled=True):
    try:
        action = None
        if enabled:
            action = "enable"
        else:
            action = "disable"
        res = await curio.subprocess.check_output(["s10s", "plugin", action, plugin_id, "--format=json"])
    except curio.subprocess.CalledProcessError as e:
        print(e.output)
        raise

    return json.loads(res)


async def test():
    print(await search(type="screen"))


if __name__ == "__main__":
    if len(sys.argv) > 1:
        serverboards.test_mode(test, {})

    serverboards.loop()
