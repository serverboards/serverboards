#!/usr/bin/python3

import sys
import os
import re
import datetime
sys.path.append(os.path.join(os.path.dirname(__file__), '../bindings/python/'))
import serverboards_aio as serverboards
from serverboards_aio import Plugin, print
from pcolor import printc

TEMPLATE_RE = re.compile(r"{{([\w.]*)}}")


def render_template_with_dates(template):
    def replace(data):
        var = data.group(1)
        if var == "date":
            return datetime.datetime.now().strftime("%Y%m%d")
        if var == "date_":
            return datetime.datetime.now().strftime("%Y-%m-%d")
        if var == "time":
            return datetime.datetime.now().strftime("%H:%M")
        if var == "times":
            return datetime.datetime.now().strftime("%H:%M:%S")
        if var == "datetime":
            return datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
        return data[0]
    return TEMPLATE_RE.sub(replace, template)


@serverboards.rpc_method
async def read_source(fifofile, config, context={}):
    print("Read from %s to %s" % (config, fifofile))
    async with Plugin("serverboards.core.ssh/sshcmd") as ssh:
        await ssh.run(
            service=config["service"],
            command=["cat", config["path"]],
            outfile=fifofile,
            context=context)
        size = int((await ssh.run(
            service=config["service"],
            command=["du", "-sb", config["path"]],
            context=context))["stdout"].split()[0])
        await serverboards.info("Done, read %s" % size, **context)
        return size


@serverboards.rpc_method
async def read_source_tar(fifofile, config, context={}):
    print("Read from %s to %s" % (config, fifofile))
    async with Plugin("serverboards.core.ssh/sshcmd") as ssh:
        await ssh.run(
            service=config["service"],
            command=["tar", "cz", config["path"]],
            outfile=fifofile, context=context)
        output = await ssh.run(
            service=config["service"],
            command=["du", "-sb", config["path"]],
            context=context)
        stdout = output["stdout"]
        if not stdout:
            raise Exception("file not exists")
        size = int(stdout.split()[0])
        await serverboards.info("Done, read %s" % size, **context)
        return size


@serverboards.rpc_method
async def write_destination(fifofile, config, context={}):
    print("Write to %s from %s" % (config, fifofile))
    async with Plugin("serverboards.core.ssh/sshcmd") as ssh:
        copyto = config["path"]
        if '{{' in copyto:
            copyto = render_template_with_dates(copyto)
        await ssh.run(
            service=config["service"], command=["cat", ">", copyto],
            infile=fifofile, context=context)
        stdout = (await ssh.run(
            service=config["service"], command=["du", "-sb", copyto],
            context=context))["stdout"]
        if not stdout:
            raise Exception("file not created")
        size = int(stdout.split()[0])
        await serverboards.info("Done, write %s" % size, **context)
        return size


async def test():
    printc("TESTING")
    try:
        os.unlink("/tmp/fifofile")
    except Exception:
        pass
    os.mkfifo("/tmp/fifofile")
    await read_source_tar("/tmp/fifofile", {"service": "XXX", "path": "."})
    await write_destination("/tmp/fifofile", {"service": "XXX", "path": "/tmp/testbackup.tgz"})

    await read_source("/tmp/fifofile", {"service": "XXX", "path": "/etc/hostname"})

    os.unlink("/tmp/fifofile")
    pass


if 'test' in sys.argv:
    import yaml
    printc("Test")
    mock_data = yaml.load(open("mock.yaml"))
    serverboards.test_mode(test, mock_data=mock_data)
    printc("DONE")
else:
    serverboards.loop()
