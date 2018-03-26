#!/usr/bin/python3

import sys
import os
import pty
import shlex
import pexpect
import uuid
import re
import random
import urllib.parse as urlparse
import base64
from io import StringIO
from common import ID_RSA, ensure_ID_RSA, CONFIG_FILE
sys.path.append(os.path.join(os.path.dirname(__file__), '../bindings/python/'))
from pcolor import printc
import serverboards_aio as serverboards
from serverboards_aio import print, rpc, cache_ttl
from curio import subprocess
import curio

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
              outfile=None, infile=None, debug=True, context={}):
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
            "Executing SSH command: [ssh '%s'] // Command %s" %
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
    kwargs["stderr"] = subprocess.PIPE
    # Real call to SSH
    stdout = None
    try:
        # printc(
        #     "ssh ", ' '.join(args),
        #     ' '.join(
        #         "--%s=%s" % (k,v) for (k,v)
        #         in kwargs.items() if not k.startswith('_')
        #     ))
        ssh = subprocess.Popen(args, shell=False, **kwargs)
        exit_code = await ssh.wait()
    except Exception as e:
        serverboards.log_traceback(e)
        stderr = str(e)
        exit_code = 1
        ssh = None

    if outfile:
        kwargs["stdout"].close()
    elif ssh:
        stdout = (await ssh.stdout.read()).decode('utf8')
        stderr = (await ssh.stderr.read()).decode('utf8')
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
    opts += ['-t', '-t', '--', '/bin/bash']
    (ptymaster, ptyslave) = pty.openpty()
    ptymaster = curio.file.AsyncFile(os.fdopen(ptymaster, 'bw'))
    ptyslave = curio.file.AsyncFile(os.fdopen(ptyslave, 'br'))

    print("SSH Terminal: '%s'" % ("' '".join(["/usr/bin/ssh"] + opts)))
    sp = subprocess.Popen(["ssh"] + opts,
                          stdin=ptyslave, stdout=subprocess.PIPE, shell=False,
                          stderr=subprocess.STDOUT, env={"TERM": "linux"})
    _uuid = str(uuid.uuid4())
    sessions[_uuid] = dict(process=sp, buffer=b"", end=0,
                           uidesc=uidesc, ptymaster=ptymaster)

    await curio.spawn(lambda: data_event_waitread(_uuid))

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
    ret = await sp["ptymaster"].write(data)
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
    while True:
        sp = sessions[uuid]
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
    maybe = open_ports.get(port_key)
    if maybe:
        return maybe

    keep_trying = True
    while keep_trying:
        keep_trying = False
        localport = random.randint(20000, 60000)
        if hostname and port:
            mopts = opts + ["-nNT", "-L", "%s:%s:%s" %
                            (localport, hostname, port)]
        elif unix:
            mopts = opts + ["-nNT", "-L", "%s:%s" % (localport, unix)]
        else:
            raise Exception("need hostname:port or unix socket")
        await serverboards.debug("Open port with: [ssh '%s']" % "' '".join(
            mopts), service_id=service, **context)
        sp = subprocess.Popen(["ssh", *mopts], stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        port_to_process[localport] = sp
        async with curio.ignore_after(5):
            data = await sp.stdout.read()
            if 'Address already in use' in data:
                keep_trying = True
                await sp.close()
            break

    open_ports[port_key] = localport
    await serverboards.debug(
        "Port redirect localhost:%s -> %s:%s" %
        (localport, hostname, port), **context)
    return localport


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


@serverboards.rpc_method
def watch_start(id=None, period=None, service_id=None, script=None, **kwargs):
    period_s = time_description_to_seconds(period or "5m")

    class Check:

        def __init__(self):
            self.state = None

        def check_ok(self):
            stdout = None
            stderr = None
            exit_code = 0
            try:
                p = run(service=service_id, command=script)
                stdout = p["stdout"]
                stderr = p["stderr"]
                exit_code = p["exit"]
                # serverboards.info(
                #     "SSH remote check script: %s: %s"%(script, p),
                #     extra=dict(
                #         rule=id,
                #         service=service_id,
                #         script=script,
                #         stdout=stdout,
                #         exit_code=p)
                #     )
            except Exception as e:
                serverboards.error(
                    "Error on SSH script: %s" % script,
                    rule=id, script=script, service=service_id)
                exit_code = -256
                stdout = str(e)
            nstate = "ok" if (exit_code == 0) else "nok"
            if self.state != nstate:
                serverboards.rpc.event("trigger", {
                    "id": id,
                    "state": nstate,
                    "success": (exit_code == 0),
                    "exit": exit_code,
                    "stdout": stdout,
                    "stderr": stderr
                })
                self.state = nstate
            return True
    check = Check()
    check.check_ok()
    timer_id = serverboards.rpc.add_timer(period_s, check.check_ok, rearm=True)
    serverboards.info("Start SSH script watch %s" % timer_id)
    return timer_id


@serverboards.rpc_method
def watch_stop(id, **kwargs):
    print(kwargs)
    serverboards.info("Stop SSH script watch %s" % (id))
    serverboards.rpc.remove_timer(id)
    return "ok"


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
def popen(service_uuid, command, stdin=None, stdout=None):
    """
    Creates a popen to a command on a remote SSH service.

    It requires the command to execute and returns the write and read pipe
    descriptors.

    It might get the stdin and stdout descriptors to directly connect to for
    example another pipe. In this case it will return None as the pipe to
    write/read as it is the other end who knows where to write/read.

    The caller writes to stdin and reads from stdout.
    """
    url, opts, precmd = __get_service_url_and_opts(service_uuid)
    opts = opts + ["--", precmd] + command
    opts = [item for sublist in opts for item in sublist]
    ssh = subprocess.Popen(
        ["ssh"] + opts, stdin=subprocess.PIPE, stdout=subprocess.PIPE)
    # adapter from pipe at the ssh to the s10s pipes, one for each stdin/out

    if stdin:
        write_in_fd, write_out_fd = None, stdin
    else:
        write_in_fd, write_out_fd = file.pipe(async=True)
    if stdout:
        read_in_fd, read_out_fd = stdout, None
    else:
        read_in_fd, read_out_fd = file.pipe(async=True)

    print("Write fds: ", write_in_fd, write_out_fd, command[0])
    print("Read fds: ", read_in_fd, read_out_fd, command[0])
    print("Starting SSH popen:", command[0])
    # store all subscriptions, to unsubscribe at closed
    subscriptions = []
    write_count = 0
    read_count = 0

    def write_to_ssh():
        nonlocal write_count
        block = file.read(write_out_fd, {"nonblock": True})
        closed = False
        if block == -1:
            closed = True
        while block and block != -1:
            write_count += len(block)
            decoded = base64.b64decode(block.encode('ascii'))
            ssh.stdin.write(decoded)
            ssh.stdin.flush()
            block = file.read(write_out_fd, {"nonblock": True})
            # print("cont Write to %s %d bytes, read from %s %s"%(command[0],
            # len(block), write_out_fd, decoded[0:5]))

        # now it might close
        if closed:
            print("Closed reading. Close all. ", command[0])
            close_all()

    MAX_SIZE = 24 * 1024

    def read_from_ssh():
        # print("Data ready?")
        block = ssh.stdout.read(MAX_SIZE)
        nonlocal read_count
        closed = False
        if not block:  # if nothing to read on first call, the fd is closed
            closed = True
        while block:
            # print("Read from %s %d bytes, write to %s"%(command[0],
            #       len(block), read_in_fd))
            read_count += len(block)
            wres = file.write(
                read_in_fd, base64.b64encode(block).decode('ascii'))
            if not wres:
                closed = True
                block = None
            else:
                block = ssh.stdout.read(MAX_SIZE)
        if closed:
            print("Closed writing. Close all.", command[0])
            close_all()

    closedone = 0

    def close_all():
        nonlocal closedone
        if closedone:
            return
        closedone += 1

        print("Close all", command[0])
        # I close all input
        file.close(write_in_fd)
        file.close(write_out_fd)
        # will not write more to output
        file.close(read_in_fd)
        # remove the ssh data ready event
        rpc.remove_event(ssh.stdout)
        # remove all subscriptions
        for s in subscriptions:
            if s:
                rpc.unsubscribe(s)
        # ensure all written into stdin is flushed
        print("Flush and terminate")
        ssh.stdin.flush()
        print("Try to terminate")
        # if still alive, terminate it
        if ssh.poll() is None:
            # print("Terminate", command[0])
            try:
                # force write pending, will not recurse because of closedone
                write_to_ssh()
                ssh.terminate()
                # time.sleep(1)
                # ssh.kill()
            except Exception:
                pass
        else:
            # print("Cant terminate (already terminated?)", ssh.poll(),
            #       command[0])
            pass
        print("SSH command %s terminated (%d in/%d out)" %
              (command[0], write_count, read_count))

    close_count = 0

    def close_one():
        """
        Closed one of the remote ends. If both are closed, nobody will read, no
        point in having it open.
        """
        print("Close one", command[0])
        nonlocal close_count
        close_count += 1
        if close_count >= 2:
            close_all()

    def call_if_fd(check_fd, f):
        def call_if_fd_inner(fd=None):
            if fd == check_fd:
                print("Run %s(%s)" % (f.__name__, fd))
                return f()
        return call_if_fd_inner

    r_id = rpc.subscribe(
        "file.ready[%s]" % write_out_fd, call_if_fd(write_out_fd, write_to_ssh)
    )
    subscriptions = [r_id]
    for i in [write_in_fd, write_out_fd, read_in_fd, read_out_fd]:
        if i:
            sid = rpc.subscribe(
                "file.closed[%s]" % i, call_if_fd(i, close_one)
            )
            subscriptions.append(sid)

    rpc.add_event(ssh.stdout, read_from_ssh)

    return [write_in_fd, read_out_fd]


@serverboards.rpc_method
async def ssh_is_up(service):
    try:
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
    except Exception as e:
        printc(e)
        import traceback
        i = StringIO()
        traceback.print_exc(file=i)
        i.seek(0)
        printc(i.read())
        await serverboards.error(
            "Error checking the state of service",
            error=str(e), service_id=service.get("uuid"))
        return "error"


async def test():
    sys.stdout = sys.stderr
    printc("Start tests")

    ret = await ssh_is_up({
        "config": {"url": "ssh://localhost"},
        "type": "serverboards.core.ssh/ssh",
        "uuid": "XXX"
    })
    printc("SSH IS UP?", ret, color="green")
    assert ret

    ret = await run(service="XXX", command=["date", "%s"])
    printc("date -- ", ret, color="green")
    assert ret["stdout"] == ""
    assert ret["stderr"] != ""
    assert not ret["success"]

    ret = await run(service="XXX", command=["date", "+%s"])
    printc("date -- ", ret, color="green")
    assert ret["stdout"] != ""
    # assert ret["stderr"] == ""
    assert ret["success"]

    uuid = await _open("ssh://localhost")
    printc("UUID", uuid)

    ret = await sendline(uuid, "ls")
    printc(ret)

    ret = recv(uuid)
    printc(ret)

    await close(uuid)

    # scp
    ret = await scp("XXX", "/etc/hostname", None, "/tmp/")
    printc(ret)

    # openport
    ret = await open_port("XXX", "localhost", 25)
    printc("Got port", ret)
    await close_port(ret)


if __name__ == '__main__':
    import yaml
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        printc("Test")
        mock_data = yaml.load(open("mock.yaml"))
        serverboards.test_mode(test, mock_data=mock_data)
        printc("DONE")
    else:
        serverboards.loop()
