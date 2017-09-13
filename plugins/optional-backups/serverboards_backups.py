#!/usr/bin/python3

import sys, os, sys, uuid, datetime
sys.path.append(os.path.join(os.path.dirname(__file__),'../bindings/python/'))
import serverboards
from serverboards import print, plugin, Plugin, rpc

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

def datetime_now():
    return datetime.datetime.now().strftime("%Y-%m-%d %H:%M")

class Backup:
    def __init__(self, job):
        self.job=job
        self.fifofile = None
        source = job["source"]
        destination = job["destination"]

        self.id = str(uuid.uuid4())
        self.read_source = get_backup_fn(source["component"], "read_source")
        self.write_destination = get_backup_fn(destination["component"], "write_destination")

        self.fifofile = os.path.join(TMPDIR, str(uuid.uuid4()))
        print("Backup %s at %s"%(job["id"], self.fifofile))
        os.mkfifo(self.fifofile, 0o0600)
        self.source_job = self.read_source(self.fifofile, source["config"], _async=(self.source_done, self.source_error))
        self.destination_job = self.write_destination(self.fifofile, destination["config"], _async=(self.destination_done, self.destination_error))

        self.source_size=None
        self.destination_size=None
        self.update_job(status="running", size=None)

    def source_done(self, size):
        self.source_size=size
        if self.destination_size:
            self.finished_backup()
        pass
    def source_error(self, error):
        serverboards.error("Error on source backup: %s"%str(error))
        self.source_size="error"
        if self.destination_size:
            self.finished_backup()
    def destination_done(self, size):
        self.destination_size=size
        if self.source_size:
            self.finished_backup()
    def destination_error(self, error):
        serverboards.error("Error on destination backup: %s"%str(error))
        self.destination_size="error"
        if self.source_size:
            self.finished_backup()

    def finished_backup(self):
        if self.source_size == "error" or self.destination_size=="error":
            self.update_job(status="error", size=None, completed_date=datetime_now())
        else:
            self.update_job(status="ok", size=self.destination_size, completed_date=datetime_now())

        if self.fifofile:
            print("Unlink fifo (1)")
            os.unlink(self.fifofile)
            self.fifofile=None
        del self
    def update_job(self, **kwargs):
        self.job.update(kwargs)
        rpc.call("plugin.data.update", self.job["id"], self.job)

    def __del__(self):
        if self.fifofile:
            print("Unlink fifo (2)")
            os.unlink(self.fifofile)


serverboards.loop(debug=True)
