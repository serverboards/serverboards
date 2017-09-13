#!/usr/bin/python3

import sys, os, sys, uuid
sys.path.append(os.path.join(os.path.dirname(__file__),'../bindings/python/'))
import serverboards
from serverboards import Plugin, print

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
        ssh.run(service=config["service"], command=["cat", ">", config["path"]], infile=fifofile)
        size = int(ssh.run(service=config["service"], command=["du","-sb",config["path"]])["stdout"].split()[0])
        print("Done, write %s"%size)
        return size

if 'test' in sys.argv:
    test()
else:
    serverboards.loop()
