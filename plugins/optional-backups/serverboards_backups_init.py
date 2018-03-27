#!/usr/bin/python3

import sys
import os
import datetime
sys.path.append(os.path.join(os.path.dirname(__file__), '../bindings/python/'))
import serverboards
from serverboards import print

# Stores all backup id to timer, to remove them if necessary
timers = {}
all_backups = []


@serverboards.rpc_method
def init():
    global all_backups

    print("Starting backup init")
    for timer_id in timers.values():
        serverboards.rpc.remove_timer(timer_id)

    all_backups = serverboards.plugin.data.items(
        "serverboards.optional.backups", "")

    for id, backup in all_backups:
        if not backup.get("enabled"):
            continue
        schedule = backup.get("schedule")
        if schedule.get("days") == []:
            continue
        try:
            program_backup(schedule.get("days"), schedule.get("time"), id)
        except Exception as e:
            serverboards.rpc.log_traceback(e)
    return 60 * 60 * 24  # each 24h reload init.


def program_backup(orig_days, time, id):
    now = datetime.datetime.now()
    # How many days to the week day
    nowday = now.weekday()
    days = [d % 7 for d in orig_days]  # monday is 0 here.
    # on this week, how many days till the day
    days = [nowday - d for d in days]
    # set up a datetime with the specified hour
    h, m, s, _ = (time + ":00:00").split(':', 3)
    days = [(now - datetime.timedelta(days=d)).replace(hour=int(h),
                                                       minute=int(m),
                                                       second=int(s))
            for d in days]
    # add seven days if in the past
    days = [(d + datetime.timedelta(days=7)) if d <=
            now else d for d in days]  # if past, set for next week
    # sort them
    days.sort()
    # seconds to next
    time_to_next = (days[0] - now).total_seconds()
    # check
    print("Backup programming: ", id, time_to_next,
          days[0], time_to_next / (60 * 60))

    timer_id = serverboards.rpc.add_timer(
        time_to_next, lambda: backup_now(orig_days, time, id))
    timers[id] = timer_id


@serverboards.rpc_method
def backup_now(days, time, id):
    print("Do backup now of %s" % id)
    serverboards.action.trigger(
        "serverboards.optional.backups/backup.now", dict(backup=id))
    # reprogram for next occurence
    print(days, time, id)
    program_backup(days, time, id)
    debug()


def maybe_recalculate_timers(plugin=None, key=None, value=None):
    assert plugin == "serverboards.optional.backups"

    must_recalculate = True
    for id, b in all_backups:
        if b["id"] == value["id"]:
            must_recalculate = (b["schedule"] != value["schedule"] or b.get(
                "enabled") != value.get("enabled"))
    if must_recalculate:
        print("Recalculating timers.")
        init()
    else:
        print("No schedule changes")


@serverboards.rpc_method
def debug():
    return repr(serverboards.rpc.timers)


# on any change on backups, redo the timers
serverboards.rpc.subscribe(
    "plugin.data_changed[serverboards.optional.backups]",
    maybe_recalculate_timers)

serverboards.loop()
