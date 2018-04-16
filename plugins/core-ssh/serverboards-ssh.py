#!/usr/bin/python3

import sys
import os
import pty
import shlex
import uuid
import re
import random
import urllib.parse as urlparse
import base64
from io import StringIO
from common import ID_RSA, ensure_ID_RSA, CONFIG_FILE
from pcolor import printc
import signal
import ctypes
libc = ctypes.CDLL("libc.so.6")
sys.path.append(os.path.join(os.path.dirname(__file__), '../bindings/python/'))
import serverboards_aio as serverboards
from serverboards_aio import print, rpc, cache_ttl
from curio import subprocess
import curio

sys.stdout = sys.stderr

def set_pdeathsig(sig=signal.SIGTERM):
    def callable():
        return libc.prctl(1, sig)
    return callable


td_to_s_multiplier = [
    ("ms", 0.001),
    ("s", 1),
    ("m", 60),
    ("h", 60 * 60),
    ("d", 24 * 60 * 60),
]


def try_or(fn, _else):
    try:
        return fn()
    except Exception:
        return _else


def time_description_to_seconds(td):
    if type(td) in (int, float):
        return float(td)
    for sufix, multiplier in td_to_s_multiplier:
        if td.endswith(sufix):
            return float(td[:-len(sufix)]) * multiplier
    return float(td)


def url_to_opts(url):
    """
    Url must be an `ssh://username:password@hostname:port/` with all optional
    except hostname. It can be just `username@hostname`, or even `hostname`
    """
    if '//' not in url:
        url = "ssh://" + url
    u = urlparse.urlparse(url)
    assert u.scheme == 'ssh'

    ret = [u.hostname, '-i', ID_RSA, '-F', CONFIG_FILE]
    if u.port:
        ret += ["-p", str(u.port)]
    if u.username:
        ret[0] = u.username + '@' + u.hostname
    return (ret, u)


@serverboards.rpc_method
async def run(command=None, service=None,
              outfile=None, infile=None, stdin=None,
              debug=False, context={}):
    """
    Runs a remote command at a remote SSH

    can pass a communication `outfile` and `infile` (at /tmp/)
    and also a `stdin` string to be used as script to execute.
    """
    # serverboards.debug(repr(dict(url=url, command=command, options=options,
    #                    service=service)))
    await ensure_ID_RSA()
    if not command:
        raise Exception("Need a command to run")
    if isinstance(command, str):
        command = shlex.split(command)
    _url, args, precmd = await __get_service_url_and_opts(service)
    args = ['ssh', *args, '--', *precmd, *command]
    if debug:
        await serverboards.debug(
            "Executing SSH command: ['%s'] // Command %s" %
            ("' '".join(str(x) for x in args), command), **context)
    # Each argument is an element in the list, so the command, even if it
    # contains ';' goes all in an argument to the SSH side
    kwargs = {}
    if outfile:
        assert outfile.startswith(
            "/tmp/") and '..' not in outfile  # some security
        kwargs["stdout"] = open(outfile, "wb")
    else:
        kwargs["stdout"] = subprocess.PIPE
    if infile:
        assert infile.startswith("/tmp/") and '..' not in infile
        kwargs["stdin"] = open(infile, "rb")
    else:
        kwargs["stdin"] = subprocess.PIPE if stdin else None
    kwargs["stderr"] = subprocess.PIPE
    # Real call to SSH
    stdout = ""
    stderr = ""
    try:
        # printc(
        #     "ssh ", ' '.join(args),
        #     ' '.join(
        #         "--%s=%s" % (k,v) for (k,v)
        #         in kwargs.items() if not k.startswith('_')
        #     ))

        ssh = subprocess.Popen(
            args,
            shell=False,
            preexec_fn=set_pdeathsig(signal.SIGTERM),
            **kwargs
        )
        if stdin:
            stdout, stderr = await ssh.communicate(stdin.encode('utf8'))
            stdout = stdout.decode('utf8')
            stderr = stderr.decode('utf8')
        exit_code = await ssh.wait()
    except curio.errors.TaskTimeout as e:
        await serverboards.error(
            "ssh %s:'%s' timeout: %s" %
            (service if isinstance(service, str) else service["uuid"],
             command, e)
        )
        stderr = "timeout"
        exit_code = 1
        ssh = None
    except curio.errors.TaskCancelled:
        raise
    except Exception as e:
        await serverboards.error(
            "ssh %s:'%s' %s" %
            (service if isinstance(service, str) else service["uuid"],
             command, e)
        )
        serverboards.log_traceback(e)
        stderr = str(e)
        exit_code = 1
        ssh = None

    if outfile:
        kwargs["stdout"].close()
    elif ssh:
        stdout += (await ssh.stdout.read()).decode('utf8')
        stderr += (await ssh.stderr.read()).decode('utf8')
    if infile:
        kwargs["stdin"].close()

    if isinstance(service, dict):
        service_id = service["uuid"]
    else:
        service_id = service
    if exit_code == 0:
        await serverboards.info(
            "SSH Command success %s:'%s'" %
            (service_id, "' '".join(command)),
            **{**dict(service_id=service_id, command=command), **context})
    else:
        await serverboards.error(
            "SSH Command error %s:'%s'" %
            (service_id, "' '".join(command)),
            **{**dict(
               service_id=service_id,
               command=command,
               exit_code=exit_code,
               stderr=stderr,
               ),
               **context
               }
        )
    return {
        "stdout": stdout,
        "stderr": stderr,
        "exit": exit_code,
        "success": exit_code == 0,
    }


sessions = {}


@serverboards.rpc_method("open")
async def _open(url, uidesc=None, options=""):
    await ensure_ID_RSA()
    if not uidesc:
        uidesc = url
    options = [x.strip() for x in options.split('\n')]
    options = [x for x in options if x and not x.startswith('#')]

    (opts, url) = url_to_opts(url)
    options = (await __get_global_options()) + options
    opts += [
        arg.strip()
        for option in options
        for arg in ['-o', option]
    ]
    opts += ['-t', '-t']  # ,"--", "/bin/bash"
    (ptymaster, ptyslave) = pty.openpty()
    ptymaster = os.fdopen(ptymaster, 'bw')
    ptymaster = curio.file.AsyncFile(ptymaster)

    ssh_cmd = ["/usr/bin/ssh"] + opts
    print("SSH Terminal: '%s'" % ("' '".join(ssh_cmd)))
    sp = subprocess.Popen(ssh_cmd,
                          stdin=ptyslave, stdout=subprocess.PIPE, shell=False,
                          stderr=subprocess.STDOUT, env={"TERM": "linux"},
                          preexec_fn=set_pdeathsig(signal.SIGTERM),
                          )
    _uuid = str(uuid.uuid4())
    sessions[_uuid] = dict(process=sp, buffer=b"", end=0,
                           uidesc=uidesc, ptymaster=ptymaster)

    await curio.spawn(lambda: data_event_waitread(_uuid), daemon=True)

    return _uuid


@serverboards.rpc_method
async def close(uuid):
    sp = sessions[uuid]
    process = sp['process']
    if process:
        process.kill()
        await process.wait()
        del sp['process']
    del sessions[uuid]
    return True


@serverboards.rpc_method
def list():
    return [(k, v['uidesc']) for k, v in sessions.items()]


@serverboards.rpc_method
async def send(uuid, data=None, data64=None):
    """
    Sends data to the terminal.

    It may be `data` as utf8 encoded, or `data64` as base64 encoded

    data64 is needed as control charaters as Crtl+L are not utf8 encodable and
    can not be transmited via json.
    """
    sp = sessions[uuid]
    if not data:
        data = base64.decodestring(bytes(data64, 'utf8'))
    else:
        data = bytes(data, 'utf8')
    # ret = sp.send(data)
    ptymaster = sp["ptymaster"]
    ret = await ptymaster.write(data)
    await ptymaster.flush()
    return ret


@serverboards.rpc_method
def send_control(uuid, type, data):
    """
    Sends control data to the terminal, as for example resize events
    """
    sp = sessions[uuid]
    if type == 'resize':
        import termios
        import struct
        import fcntl

        winsize = struct.pack("HHHH", data['rows'], data['cols'], 0, 0)
        fcntl.ioctl(sp['ptymaster'].fileno(), termios.TIOCSWINSZ, winsize)

        return True
    else:
        serverboards.warning("Unknown control type: %s" % (type))
        return False


@serverboards.rpc_method
async def sendline(uuid, data):
    return await send(uuid, data + '\n')


async def data_event_waitread(uuid):
    sp = sessions[uuid]
    try:
        while True:
            raw_data = await sp["process"].stdout.read(4096)
            if not raw_data:
                await serverboards.rpc.event(
                    "event.emit", "terminal.data.received.%s" % uuid,
                    {"eof": True, "end": sp["end"]})
                # wait a little bit, normally will be already exited
                await sp['process'].wait()
                return
            sp['buffer'] = (sp['buffer'] + raw_data)[-4096:]  # keep last 4k
            sp['end'] += len(raw_data)

            data = str(base64.encodestring(raw_data), 'utf8')
            await serverboards.rpc.event(
                "event.emit", "terminal.data.received.%s" % uuid,
                {"data64": data, "end": sp["end"]}
            )
    finally:
        # printc(sp)
        if "process" in sp:
            sp["process"].terminate()
            sp["process"].kill()


@serverboards.rpc_method
def recv(uuid, start=None, encoding='utf8'):
    """
    Reads some data from the ssh end.

    It may be encoded for transmission. Normally all text is utf8, but control
    chars are not, and they can not be converted for JSON encoding. Thus base64
    is allowed as encoding.

    It can receive a `start` parameter that is from where to start the buffer
    to return. The buffer has a position from the original stream, and all data
    returns to the end of that stream position. Its possible to ask from a
    specific position and if available will be returned. If its none returns
    all buffer.

    This can be used to regenerate the terminal status from latest 4096 bytes.
    On most situations may suffice to restore current view. Also can be used to
    do polling, although events are recomended.
    """
    sp = sessions[uuid]
    raw_data = sp['buffer']
    bend = sp['end']
    bstart = bend - len(raw_data)

    i = 0  # on data buffer, where to start
    if start is not None:
        if start < bstart:
            raise Exception("Data not in buffer")
        elif start > bend:
            i = len(raw_data)  # just end
        else:
            i = start - bstart
    raw_data = raw_data[i:]
    # print(raw_data, repr(raw_data))
    if encoding == 'b64':
        data = str(base64.encodestring(raw_data), 'utf8')
    else:
        data = str(raw_data, encoding)
    return {'end': bend, 'data': data}


port_to_process = {}
open_ports = {}
opening_ports = {}
envvar_re = re.compile(r'^[A-Z_]*=.*')


@cache_ttl(ttl=60)
async def __get_service_url_and_opts(service_uuid):
    """
    Gets the necesary data to call properly a SSH command for a given service
    uuid

    It returns a tuple with:
     * the url to be used (root@localhost)
     * Options to pass to ssh, as a list of all options
     * Some pre command to execute if applciabl. This is useful to set an
       initial environment, or (TODO) sudo
    """
    assert service_uuid, "Need service UUID"
    service = await __get_service(service_uuid)
    if not service or service["type"] != "serverboards.core.ssh/ssh":
        print(service)
        raise Exception("Could not get information about service")
    url = service["config"]["url"]

    options = [x.strip()
               for x in service["config"].get("options", "").split('\n') if x]
    options = (await __get_global_options()) + options
    envs = [i for i in options if envvar_re.match(i)]
    options = [i for i in options if not envvar_re.match(i)]
    options = [
        arg
        for option in options
        for arg in ['-o', option]  # flatten -o option
    ]

    conn_opts, url = url_to_opts(url)
    options += conn_opts

    if envs:
        precmd = [';'.join(envs) + ' ; ']
    else:
        precmd = []

    return (url, options, precmd)


@serverboards.rpc_method
async def open_port(service=None, hostname=None,
                    port=None, unix=None, context={}):
    """
    Opens a connection to a remote ssh server on the given hostname and port.

    This will make a local port accesible that will be equivalent to the remote
    one. The local one is random.

    Arguments:
        url --  The ssh server url, as ssh://[username@]hostname[:port], or
                simple hostname (required or service)
        service -- UUID of the proxying service, instead of the URL.
        hostname -- Remote hostname to connect to. Default `localhost` which
                would be the SSH server
        port -- Remote port to connect to
        unix -- Unix socket to connect to

    Returns:
     localport -- Port id on Serverboards side to connect to.
    """
    await ensure_ID_RSA()
    assert service
    (url, opts, _precmd) = await __get_service_url_and_opts(service)

    port_key = (url.netloc, port)

    try:
        # await serverboards.debug("Open port %s:%s" % (hostname, port))
        while True:
            # this check in the buffer as it may happen in another async task
            maybe = open_ports.get(port_key)
            if maybe:
                # await serverboards.debug(
                #     "Port is open %s:%s -> %s" % (hostname, port, maybe))
                return maybe

            opening = opening_ports.get(port_key)
            if opening:
                # await serverboards.debug(
                #     "Already opening %s:%s, wait for master." %
                #     (hostname, port))
                await opening.wait()
                continue  # keep trying

            opening_ports[port_key] = curio.Event()

            localport = random.randint(20000, 60000)
            # await serverboards.debug(
            #     "Open port %s:%s -> %s?" % (hostname, port, localport))

            if hostname and port:
                mopts = opts + ["-nNT", "-L", "%s:%s:%s" %
                                (localport, hostname, port)]
            elif unix:
                mopts = opts + ["-nNT", "-L", "%s:%s" % (localport, unix)]
            else:
                raise Exception("need hostname:port or unix socket")
            # await serverboards.debug("Open port with: [ssh '%s']" % "' '".join(
            #     mopts), service_id=service, **context)
            sp = subprocess.Popen(
                ["ssh", *mopts],
                stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                preexec_fn=set_pdeathsig(signal.SIGTERM),
            )
            port_to_process[localport] = sp
            data = b""
            async with curio.ignore_after(5):
                data = await sp.stdout.read()
            if b'Address already in use' in data:
                # await serverboards.warning(
                #     "Port already in use, try another port.")
                await sp.close()
            else:
                open_ports[port_key] = localport
                await serverboards.debug(
                    "Port redirect localhost:%s -> %s:%s" %
                    (localport, hostname, port), **context)
                return localport
    finally:  # if exception also free the event waiters,
        if port_key in opening_ports:
            await opening_ports[port_key].set()
            del opening_ports[port_key]


@serverboards.rpc_method
async def close_port(port):
    """
    Closes a remote connected port.

    Uses the local port as identifier to close it.
    """
    port_to_process[port].kill()
    await port_to_process[port].wait()
    del port_to_process[port]
    global open_ports
    open_ports = {url: port for url,
                  port in open_ports.items() if port != port}
    await serverboards.debug("Closed port redirect localhost:%s" % (port))
    return True


watches = {}


@serverboards.rpc_method
async def watch_start(id=None, period=None, service_id=None,
                      script=None, **kwargs):
    assert id
    assert period
    assert service_id
    assert script
    period_s = max(1, time_description_to_seconds(period or "5m"))

    async def watch_task():
        await serverboards.debug("Watch start, wait time is", period_s)
        while True:
            res = await run(
                service=service_id,
                command="sh",
                stdin=script
            )
            await serverboards.rpc.event("trigger", {
                "id": id,
                "state": "ok" if res["success"] else "nok",
                **res
            })
            await curio.sleep(period_s)

    watches[id] = await curio.spawn(watch_task, daemon=True)
    return id


@serverboards.rpc_method
async def watch_stop(id, **kwargs):
    await serverboards.info("Stop SSH script watch %s" % (id))
    task = watches.get(id)
    if task:
        await task.cancel()
        del watches[id]
        return "ok"
    return "nok"


@cache_ttl(ttl=10)
async def __get_service_url(uuid):
    data = await __get_service(uuid)
    # serverboards.info("data: %s -> %s"%(uuid, data))
    return data["config"].get("url")


@cache_ttl(ttl=60)
async def __get_service(uuid):
    if isinstance(uuid, dict):  # may get the full service instead of the uuid
        return uuid
    data = await serverboards.rpc.call("service.get", uuid)
    # serverboards.info("data: %s -> %s"%(uuid, data))
    return data


@cache_ttl(ttl=300)
async def __get_global_options():
    settings = await serverboards.rpc.call(
        "settings.get", "serverboards.core.ssh/ssh.settings", {})
    # printc(settings)
    options = settings.get("options", "")

    options = [o.strip() for o in options.split('\n')]
    options = [o for o in options if o and not o.startswith('#')]

    # default options for all
    options += ['BatchMode=yes']

    return options


@serverboards.rpc_method
async def scp(fromservice=None, fromfile=None,
              toservice=None, tofile=None, context={}):
    """
    Copies a file from a service to a service.

    It gets the data definition of the service (how to access) from
    serverboards core, so any plugin with SSH access can do this copies.

    It knows about options at URL definition, but only for one side
    (from or to).

    It is recommeneded to use it only to copy from/to host.
    """
    assert fromfile and tofile
    assert not (fromservice and toservice)
    opts = []
    if fromservice:
        url = await __get_service_url(fromservice)
        opts, _url = url_to_opts(url)
        url = opts[0]
        opts = opts[1:]
        urla = "%s:%s" % (url, fromfile)
    else:
        urla = fromfile

    if toservice:
        opts, _url = url_to_opts(await __get_service_url(toservice))
        url = opts[0]
        opts = opts[1:]
        urlb = "%s:%s" % (url, tofile)
    else:
        urlb = tofile
    opts.append("-q")
    # serverboards.info("scp %s %s %s"%(' '.join(opts), urla, urlb), **context)
    try:
        completed_process = await subprocess.run(
            ["scp", *opts, urla, urlb],
            shell=False,
        )
        if completed_process.stdout:
            await serverboards.info(completed_process.stdout, **context)
        if completed_process.stderr:
            await serverboards.error(completed_process.stderr, **context)
        await serverboards.info("Copied from %s:%s to %s:%s" % (
            fromservice, fromfile, toservice, tofile), **context)
        return True
    except Exception as e:
        import traceback
        traceback.print_exc()
        pass
    await serverboards.error(
        "Could not copy from %s:%s to %s:%s" %
        (fromservice, fromfile, toservice, tofile), **context)
    raise Exception("eaccess")


@serverboards.rpc_method
async def ssh_is_up(service):
    try:
        async with curio.timeout_after(10):
            result = await run(service=service, command=["true"])
            config = service["config"]
            if result["exit"] == 0:
                return "ok"
            elif "No route to host" in result["stderr"]:
                await serverboards.error(
                    "Cant connect host: ",
                    config["url"], stderr=result["stderr"],
                    url=config["url"], service_id=service["uuid"])
                return "error"
            elif "unauthorized" in result["stderr"]:
                await serverboards.error(
                    "Not authorized. Did you share the public SSH RSA key?",
                    url=config["url"], service_id=service["uuid"])
                return "not-authorized"
            else:
                return "nok"
    except curio.TaskTimeout:
        return "timeout"
    except Exception as e:
        serverboards.log_traceback(e)
        return "error"


async def test():
    sys.stdout = sys.stderr
    printc("Start tests")

    try:
        os.unlink("/tmp/watchresult")
    except Exception:
        pass

    printc("WATCHER")
    watch_id = await watch_start(
        id="YYY", script="true\ndate\necho 'watch'\ndate >> /tmp/watchresult",
        service_id="XXX", period="1s")
    printc("watchid", watch_id)

    printc("SSH UP", color="green")
    ret = await ssh_is_up({
        "config": {"url": "ssh://localhost"},
        "type": "serverboards.core.ssh/ssh",
        "uuid": "XXX"
    })
    printc("SSH IS UP?", ret, color="green")
    assert ret

    printc("RUN", color="green")
    ret = await run(service="XXX", command=["date", "%s"])
    printc("date -- ", ret, color="yellow")
    assert ret["stdout"] == ""
    assert ret["stderr"] != ""
    assert not ret["success"]

    ret = await run(service="XXX", command=["date", "+%s"])
    printc("date -- ", ret, color="yellow")
    assert ret["stdout"] != ""
    # assert ret["stderr"] == ""
    assert ret["success"]

    await run(service="XXX", command="touch /tmp/watchresult")

    printc("SSH to file and SSH from file")
    res = await run(
        service="XXX", command="cat", outfile="/tmp/test", stdin="testing")
    printc(res)
    assert res["success"]

    res = await run(service="XXX", command="cat", infile="/tmp/test")
    printc(res)
    assert res["success"]
    assert res["stdout"] == "testing"

    res = await run(
        service="XXX", command="cat", infile="/tmp/test", outfile="/tmp/test2")
    printc(res)
    assert res["success"]
    with open("/tmp/test2") as fd:
        assert fd.read() == "testing"

    printc("TERMINAL", color="green")

    uuid = await _open("ssh://localhost")
    printc("UUID", uuid)

    ret = await sendline(uuid, "cat /etc/hostname")
    printc(ret)
    await curio.sleep(1)

    ret = recv(uuid)
    hostname = open("/etc/hostname").read().strip()
    printc("--------------------------------------", color="yellow")
    printc(ret["data"], color="yellow")
    printc("--------------------------------------", color="yellow")
    assert hostname in ret["data"], hostname

    await close(uuid)

    printc("SCP", color="green")
    # scp
    ret = await scp("XXX", "/etc/hostname", None, "/tmp/")
    printc(ret)

    printc("OPEN_PORT", color="green")
    # openport
    ret = await open_port("XXX", "localhost", 25)
    printc("Got port", ret)
    await close_port(ret)

    printc("WATCH STOP. CHECK FILE", color="green")
    res = await watch_stop(watch_id)
    assert res == "ok"

    res = await watch_stop(watch_id)
    assert res == "nok"

    assert os.stat("/tmp/watchresult")


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        import yaml
        printc("Test")
        mock_data = yaml.load(open("mock.yaml"))
        serverboards.test_mode(test, mock_data=mock_data)
        printc("DONE")
    else:
        # serverboards.set_debug("/tmp/sshlog.log")
        serverboards.loop()
