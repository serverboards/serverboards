#!/usr/bin/python3

import sys, os, sys, uuid
sys.path.append(os.path.join(os.path.dirname(__file__),'../bindings/python/'))
import serverboards
from serverboards import print, plugin, Plugin

TMPDIR="/tmp/.serverboards-backup/"
try:
    os.makedirs(TMPDIR, 0o0700)
except:
    pass

def get_backup_fn(component, type):
    s = serverboards.plugin.component.catalog(id=component)[0]
    print(s, type)
    f = s.get("extra",{}).get(type, type)
    p = Plugin(s.get("extra",{}).get("command",{}))
    return getattr(p, f)

@serverboards.rpc_method
def backup_now(backup):
    backup=serverboards.plugin.data.get(backup)
    bk = Backup(backup)
    return bk.id

@serverboards.rpc_method
def get_backup_options(*args, **kwargs):
    print(args, kwargs)
    backups = plugin.data.items("")
    return [
        {"name": x[1]["name"], "value": x[0]}
        for x in backups
    ]

class Backup:
    def __init__(self, job):
        self.fifofile = None
        source = job["source"]
        destination = job["destination"]

        self.id = str(uuid.uuid4())
        self.read_source = get_backup_fn(source["component"], "read_source")
        self.write_destination = get_backup_fn(destination["component"], "write_destination")

        self.fifofile = os.path.join(TMPDIR, str(uuid.uuid4()))
        print("Backup %s at %s"%(job["id"], self.fifofile))
        os.mkfifo(self.fifofile, 0o0700)
        source_job = self.read_source(self.fifofile, source["config"], _async=self.source_done)
        destination_job = self.write_destination(self.fifofile, destination["config"], _async=self.destination_done)

    def source_done(self):
        print("source done")
        pass
    def destination_done(self):
        print("dest done")
        pass

    def __del__(self):
        if self.fifofile:
            print("Unlink fifo")
            os.unlink(self.fifofile)


serverboards.loop()
