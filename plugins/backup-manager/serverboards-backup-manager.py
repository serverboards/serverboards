#!/usr/bin/python3

<<<<<<< HEAD
import sys, os, datetime, hashlib
=======
import sys, os, datetime
>>>>>>> 70b67f7... [WIP] Initial trigger that monitors a file using SSH
sys.path.append(os.path.join(os.path.dirname(__file__),'../bindings/python/'))
import serverboards
from serverboards import rpc

<<<<<<< HEAD
plugin_id="serverboards.backup_manager"
=======
>>>>>>> 70b67f7... [WIP] Initial trigger that monitors a file using SSH

def convert_timespec_to_seconds(when):
    serverboards.debug("When %s"%repr(when))
    if when=='12pm':
        return 12 * 60 * 60
    if when=='12am':
        return 0
    if when=='24h':
        return 0
    if when.endswith('pm'):
        return (int(when[:-2])+12)*60*60
    if when.endswith('am'):
        return (int(when[:-2]))*60*60
    if when.endswith('h'):
        return (int(when[:-1]))*60*60
    if ':' in when:
        ts=when.split(':')
        return ((int(ts[0])*60)+int(ts[1]))*60


def time_in_seconds():
    now = datetime.datetime.now()
    t=now.time()
    today_seconds = ((t.hour*60+t.minute)*60)+t.second
    return today_seconds


def get_next_when(when):
    """
    Basic converts a time expression to the next apearance of that in seconds.
    """
    seconds_in_day=convert_timespec_to_seconds(when)
    today_seconds=time_in_seconds()
    if seconds_in_day > today_seconds:
        return seconds_in_day - today_seconds
    else:
        return today_seconds + (24 * 60 * 60) - seconds_in_day

<<<<<<< HEAD
def filename_template(filename):
    today_dt=datetime.datetime.now()
    today=today_dt.strftime("%Y-%m-%d")
    yesterday_dt=(datetime.datetime.now() - datetime.timedelta(days=1))
    yesterday=yesterday_dt.strftime("%Y-%m-%d")
    return filename.format(
        today=today,
        today_=today.replace('-',''),
        today_year=today_dt.year,
        today_month=today_dt.month,
        today_day=today_dt.day,
        yesterday=yesterday,
        yesterday_=yesterday.replace('-',''),
        yesterday_year=yesterday_dt.year,
        yesterday_month=yesterday_dt.month,
        yesterday_day=yesterday_dt.day,
    )
=======
>>>>>>> 70b67f7... [WIP] Initial trigger that monitors a file using SSH

file_exist_timers={}

@serverboards.rpc_method
def file_exists(id, service, file_expression, when):
    class Check:
        def __init__(self):
            self.prev_exists=None
        def check(self):
            if file_exist_timers.get(id):
                rpc.remove_timer(file_exist_timers.get(id))

<<<<<<< HEAD
            url = rpc.call("service.info", service)["config"]["url"]

            filename=filename_template(file_expression)

            res = rpc.call(
                "action.trigger_wait",
                "serverboards.core.ssh/exec",
                dict(url=url, command="stat -c '%%s %%y' %s; stat -f -c '%%f %%s' %s"%(filename, filename)))
            rpc.debug(res)

            exists = res['exit']==0
            if exists != self.prev_exists:
                if exists:
                    serverboards.rpc.event("trigger", id=id, state=exists)
                    res=res['stdout'].split()
                    data = {
                        "filename" : filename,
                        "size" : int(res[0])/(1024*1024), # In MB
                        "datetime" : res[1]+'T'+res[2],
                        "disk_free" : int(res[3])*int(res[4])/(1024*1024)
                    }
                    sha  = hashlib.sha256(
                        (file_expression + "-" + service).encode('utf8')
                        ).hexdigest()

                    rpc.call("plugin.data_set", plugin_id, 'test-'+sha, data)
=======
            url = rpc.call("service.info", [service])["config"]["url"]

            today=datetime.datetime.now().strftime("%Y-%m-%d")
            yesterday=(datetime.datetime.now() - datetime.timedelta(days=1)).strftime("%Y-%m-%d")
            filename=file_expression.replace('{today}', today).replace('{yesterday}', yesterday)

            ssh = rpc.call("plugin.start", ["serverboards.core.ssh/daemon"])
            res = rpc.call(ssh+".ssh_exec", {"url":url, "command": "ls -sh %s"%filename})
            rpc.call("plugin.stop",[ssh])

            exists = res and res[0]!="0"
            if exists != self.prev_exists:
                if exists:
                    serverboards.rpc.event("trigger", {"id": id, "state" : "exists"})
>>>>>>> 70b67f7... [WIP] Initial trigger that monitors a file using SSH
                else:
                    serverboards.rpc.event("trigger", {"id": id, "state" : "not-exists"})
                self.prev_exists = exists

            next_when=get_next_when(when)
            serverboards.debug("Wait %d:%d:%d"%(next_when/(60*60), (next_when/60)%60, next_when%60))

            timer_id = rpc.add_timer(next_when, self.check)
            file_exist_timers[id]=timer_id
    Check().check()
    return id

@serverboards.rpc_method
def stop_file_exists(id):
    if file_exists_timers.get(id):
        rpc.remove_timer(file_exists_timers.get(id))
        del file_exists_timers[id]


def test():
    assert convert_timespec_to_seconds("0am") == 0
    assert convert_timespec_to_seconds("12am") == 0
    assert convert_timespec_to_seconds("1am") == 60*60
    assert convert_timespec_to_seconds("12pm") == 12 * 60*60
    assert convert_timespec_to_seconds("1pm") == 13 * 60*60
    assert convert_timespec_to_seconds("13:00") == 13 * 60*60
    assert convert_timespec_to_seconds("13:30") == ((13 * 60*60) + (30 * 60))
    assert convert_timespec_to_seconds("24h") == 0
    assert convert_timespec_to_seconds("2h") == (2 * 60*60)

    print("Convert")
    print(convert_timespec_to_seconds("17:45") / (60.0*60.0))
    print(convert_timespec_to_seconds("17:40") / (60.0*60.0))
    print("Get Next")
    print(get_next_when("1pm") / (60.0*60.0))
    print(get_next_when("1am") / (60.0*60.0))
    print(get_next_when("6pm") / (60.0*60.0))
    print(get_next_when("17:45") / (60.0*60.0))
    print(get_next_when("17:40") / (60.0*60.0))
    print("Today secs")
    print(time_in_seconds() / (60.0*60.0))

if __name__=='__main__':
    if len(sys.argv)>1 and sys.argv[1]=='test':
        test()
    else:
        serverboards.loop(True)
