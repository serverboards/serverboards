#!/usr/bin/python3

import sys, os, sys, uuid, re, datetime
sys.path.append(os.path.join(os.path.dirname(__file__),'../bindings/python/'))
import serverboards
from serverboards import Plugin, print

TEMPLATE_RE=re.compile(r"{{([\w.]*)}}")
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
def read_source(fifofile, config):
    print("Read from %s to %s"%(config, fifofile))
    with Plugin("serverboards.core.ssh/sshcmd") as ssh:
        ssh.run(service=config["service"], command=["cat", config["path"]], outfile=fifofile)
        size = int(ssh.run(service=config["service"], command=["du","-sb",config["path"]])["stdout"].split()[0])
        print("Done, read %s"%size)
        return size

@serverboards.rpc_method
def read_source_tar(fifofile, config):
    print("Read from %s to %s"%(config, fifofile))
    with Plugin("serverboards.core.ssh/sshcmd") as ssh:
        ssh.run(service=config["service"], command=["tar", "cz", config["path"]], outfile=fifofile)
        size = int(ssh.run(service=config["service"], command=["du","-sb",config["path"]])["stdout"].split()[0])
        print("Done, read %s"%size)
        return size


@serverboards.rpc_method
def write_destination(fifofile, config):
    print("Write to %s from %s"%(config, fifofile))
    with Plugin("serverboards.core.ssh/sshcmd") as ssh:
        copyto = config["path"]
        if '{{' in copyto:
            copyto = render_template_with_dates(copyto)
        ssh.run(service=config["service"], command=["cat", ">", copyto], infile=fifofile)
        size = int(ssh.run(service=config["service"], command=["du","-sb",copyto])["stdout"].split()[0])
        print("Done, write %s"%size)
        return size

if 'test' in sys.argv:
    print( render_template_with_dates("/tmp/test-{{date}}.tgz") )
else:
    serverboards.loop()
