#!/usr/bin/python3

import sys
import os
import uuid
import datetime
import sh
sys.path.append(os.path.join(os.path.dirname(__file__), '../bindings/python/'))
import serverboards
from serverboards import print, plugin, Plugin, rpc
sys.stderr = serverboards.error

TMPDIR = "/tmp/.serverboards-backup/"
try:
    os.makedirs(TMPDIR, 0o0700)
except Exception:
    pass

# print(rpc.call("dir"))


def get_backup_fn(component, type):
    s = serverboards.plugin.component.catalog(id=component)[0]
    # print(s, type)
    f = s.get("extra", {}).get(type, type)
    p = Plugin(s.get("extra", {}).get("command", {}))
    return getattr(p, f)


@serverboards.rpc_method
def backup_now(backup):
    job = serverboards.plugin.data.get(backup)
    job["id"] = backup
    bk = Backup(job)
    return bk.id


@serverboards.rpc_method
def backup_stop(backup):
    backup = serverboards.plugin.data.get(backup)
    fifofile = backup.get("fifofile")
    if fifofile and os.path.exists(fifofile):
        try:
            sh.fuser("-k", fifofile)
        except Exception:
            pass
        os.unlink(fifofile)

    if backup.get("status") == "running":
        backup.update({"status": "aborted", "size": None, "fifofile": None})
        rpc.call("plugin.data.update", backup["id"], backup)
        project = backup["id"].split('-')[0]
        serverboards.rpc.event(
            "event.emit",
            "serverboards.optional.backups.updated[%s]" % project, backup)
        serverboards.info("Manually stopped backup", backup=backup["id"])


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
        self.id = job["id"]
        self.context = {"backup": self.id}
        serverboards.info("Starting backup.", **self.context)
        try:
            self.project = self.id.split('-', 1)[0]
            self.job = job
            self.fifofile = None
            source = job["source"]
            destination = job["destination"]

            self.read_source = get_backup_fn(
                source["component"], "read_source")
            self.write_destination = get_backup_fn(
                destination["component"], "write_destination")

            self.fifofile = os.path.join(TMPDIR, str(uuid.uuid4()))
            print("Backup %s at %s" % (self.id, self.fifofile), **self.context)
            os.mkfifo(self.fifofile, 0o0600)
            self.source_job = self.read_source(
                fifofile=self.fifofile, config=source["config"],
                _async=(self.source_done, self.source_error),
                context=self.context)
            self.destination_job = self.write_destination(
                fifofile=self.fifofile, config=destination["config"],
                _async=(self.destination_done, self.destination_error),
                context=self.context)

            self.source_size = None
            self.destination_size = None
            self.update_job(status="running", size=None,
                            fifofile=self.fifofile)
        except Exception:
            import traceback
            traceback.print_exc()
            serverboards.error(
                "Error initializing backup, check configuration.",
                **self.context)

    def source_done(self, size):
        serverboards.debug("Source backup finished: %s" %
                           str(size), **self.context)
        self.source_size = size
        if self.destination_size != None:
            self.finished_backup()

    def source_error(self, error):
        serverboards.error("Error on source backup: %s" %
                           str(error), **self.context)
        self.source_size = "error"
        if self.destination_size != None:
            self.finished_backup()

    def destination_done(self, size):
        serverboards.debug("Destination backup finished: %s" %
                           str(size), **self.context)
        self.destination_size = size
        if self.source_size != None:
            self.finished_backup()

    def destination_error(self, error):
        serverboards.error("Error on destination backup: %s" %
                           str(error), **self.context)
        self.destination_size = "error"
        if self.source_size != None:
            self.finished_backup()

    def finished_backup(self):
        if (self.source_size == "error" or self.destination_size == "error" or
           self.source_size == 0 or self.destination_size == 0):
            serverboards.error(
                "Backup error. Read %s bytes, write %s bytes." % (
                    self.source_size, self.destination_size),
                **self.context
            )
            now = datetime_now()
            self.update_job(status="error", size=None,
                            completed_date=now, fifofile=None)
            serverboards.action.trigger(
                "serverboards.core.actions/open-or-comment-issue", {
                    "issue": "backup/%s" % self.id,
                    "title": "Backup %s failed" % (self.job.get("name")),
                    "description": "Serverboards tried to execute the backup %s at %s, but it failed.\n\nCheck ASAP.\n\n%s" % (self.job.get("name"), now, self.job.get("description")),
                    "aliases": "backup/%s project/%s" % (self.id, self.project)
                })
        else:
            serverboards.info(
                "Backup finished. Read %s bytes, write %s bytes." % (
                    self.source_size, self.destination_size),
                **self.context
            )
            self.update_job(status="ok", size=self.destination_size,
                            completed_date=datetime_now(), fifofile=None)
            serverboards.action.trigger(
                "serverboards.core.actions/close-issue", {
                    "comment": "Backup was performed succesfully. Closing issue.",
                    "issue": "backup/%s" % (self.id)
                })

        if self.fifofile:
            print("Unlink fifo (1)", self.fifofile)
            os.unlink(self.fifofile)
            self.fifofile = None
        del self

    def update_job(self, **kwargs):
        self.job.update(kwargs)
        rpc.call("plugin.data.update", self.job["id"], self.job)
        serverboards.rpc.event(
            "event.emit",
            "serverboards.optional.backups.updated[%s]" % self.project,
            self.job)

    def __del__(self):
        if self.fifofile:
            print("Unlink fifo (2)")
            os.unlink(self.fifofile)


serverboards.loop()
