#!/usr/bin/python3

import sys, os, sys, uuid
sys.path.append(os.path.join(os.path.dirname(__file__),'../bindings/python/'))
import serverboards
from serverboards import Plugin, print

@serverboards.rpc_method
def read_source(fifofile, config):
    print("Read from %s to %s"%(config, fifofile))
    ssh = Plugin("serverboards.core.ssh/sshcmd")
    ssh.run(config["service"], ["cat", config["path"]], outfile=fifofile)
    size = int(ssh.run(config["service"], ["du","-sb",config["path"]])["stdout"].split()[0])
    return size

@serverboards.rpc_method
def write_destination(fifofile, config):
    print("Write to %s from %s"%(config, fifofile))
    ssh = Plugin("serverboards.core.ssh/sshcmd")
    ssh.run(config["service"], ["cat", ">", config["path"]], infile=fifofile)
    size = int(ssh.run(config["service"], ["du","-sb",config["path"]])["stdout"].split()[0])
    return size

if 'test' in sys.argv:
    test()
else:
    serverboards.loop()
