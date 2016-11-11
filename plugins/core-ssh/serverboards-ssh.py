#!/usr/bin/python3
import sys, os, pty
sys.path.append(os.path.join(os.path.dirname(__file__),'../bindings/python/'))
import serverboards, pexpect, shlex, re, subprocess, random
import urllib.parse as urlparse
import base64

ID_RSA=os.path.expanduser("~/.ssh/id_rsa")
ID_RSA_PUB=ID_RSA+'.pub'

def ensure_ID_RSA():
    if not os.path.exists(ID_RSA):
        os.system('ssh-keygen -f "%s" -N ""'%(ID_RSA,))


def url_to_opts(url):
    """
    Url must be an `ssh://username:password@hostname:port/` with all optional
    except hostname. It can be just `username@hostname`, or even `hostname`
    """
    if not '//' in url:
        url="ssh://"+url
    u = urlparse.urlparse(url)
    assert u.scheme == 'ssh'

    ret= [ u.hostname, '-t','-t' ]
    if u.port:
        ret +=["-p", str(u.port)]
    if u.username:
        ret[0]=u.username+'@'+u.hostname
    return (ret, u)

@serverboards.rpc_method
def ssh_exec(url, command="uname -a"):
    if not command:
        raise Exception("Need a command to run")
    (opts, url) = url_to_opts(url)
    # Each argument is an element in the list, so the command, even if it
    # contains ';' goes all in an argument to the SSH side
    sp=pexpect.spawn("/usr/bin/ssh",opts + ['--', command])
    running=True
    while running:
        ret=sp.expect([re.compile(b'^(.*)\'s password:'), pexpect.EOF])
        data=sp.before
        if ret==1:
            running=False
        elif ret==0:
            if not url.password:
                raise Exception("Need password")
            sp.sendline(url.password)
    sp.wait()
    return {"stdout": data.decode('utf8'), "exit": sp.exitstatus}

@serverboards.rpc_method
def ssh_public_key():
    ensure_ID_RSA()
    with open(ID_RSA_PUB, 'r') as fd:
        return fd.read()

sessions={}
import uuid

@serverboards.rpc_method("open")
def _open(url, uidesc=None):
    if not uidesc:
        uidesc=url

    (opts, url) = url_to_opts(url)
    opts += ['--', '/bin/bash']
    (ptymaster, ptyslave) = pty.openpty()

    sp=subprocess.Popen(["/usr/bin/ssh"] + opts,
        stdin=ptyslave, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    _uuid = str(uuid.uuid4())
    sessions[_uuid]=dict(process=sp, buffer=b"", end=0, uidesc=uidesc, ptymaster=ptymaster)

    serverboards.rpc.add_event(sp.stdout, lambda :new_data_event(_uuid) )

    return _uuid

@serverboards.rpc_method
def close(uuid):
    sp=sessions[uuid]
    serverboards.rpc.remove_event(sp['process'].stdout)
    sp['process'].kill()
    sp['process'].wait()
    del sp['process']
    del sessions[uuid]
    return True

@serverboards.rpc_method
def list():
    return [(k, v['uidesc']) for k,v in sessions.items()]

@serverboards.rpc_method
def send(uuid, data=None, data64=None):
    """
    Sends data to the terminal.

    It may be `data` as utf8 encoded, or `data64` as base64 encoded

    data64 is needed as control charaters as Crtl+L are not utf8 encodable and
    can not be transmited via json.
    """
    sp=sessions[uuid]
    if not data:
        data=base64.decodestring(bytes(data64,'ascii'))
    else:
        data=bytes(data, 'ascii')
    #ret = sp.send(data)
    ret = os.write( sp["ptymaster"], data )
    return ret

@serverboards.rpc_method
def send_control(uuid, type, data):
    """
    Sends control data to the terminal, as for example resize events
    """
    sp=sessions[uuid]
    if type=='resize':
        import termios
        import struct
        import fcntl

        winsize = struct.pack("HHHH", data['rows'], data['cols'], 0, 0)
        fcntl.ioctl(sp['ptymaster'], termios.TIOCSWINSZ, winsize)

        return True
    else:
        serverboards.warning("Unknown control type: %s"%(type))
        return False

@serverboards.rpc_method
def sendline(uuid, data):
    return send(uuid, data+'\n')

def new_data_event(uuid):
    sp=sessions[uuid]
    raw_data = os.read( sp['process'].stdout.fileno(), 4096 )
    if not raw_data:
        serverboards.rpc.event("event.emit", "terminal.data.received.%s"%uuid, {"eof": True, "end": sp["end"]})
        serverboards.rpc.remove_event(sp['process'].stdout)
        sp['process'].wait(1) # wait a little bit, normally will be already exited
        return
    sp['buffer']=(sp['buffer'] + raw_data)[-4096:] # keep last 4k
    sp['end']+=len(raw_data)

    data = str( base64.encodestring( raw_data ), 'ascii' )
    serverboards.rpc.event("event.emit", "terminal.data.received.%s"%uuid, {"data64": data, "end": sp["end"]})

@serverboards.rpc_method
def recv(uuid, start=None, encoding='utf8'):
    """
    Reads some data from the ssh end.

    It may be encoded for transmission. Normally all text is utf8, but control
    chars are not, and they can not be converted for JSON encoding. Thus base64
    is allowed as encoding.

    It can receive a `start` parameter that is from where to start the buffer to
    return. The buffer has a position from the original stream, and all data
    returns to the end of that stream position. Its possible to ask from a specific
    position and if available will be returned. If its none returns all buffer.

    This can be used to regenerate the terminal status from latest 4096 bytes. On
    most situations may suffice to restore current view. Also can be used to do
    polling, although events are recomended.
    """
    sp = sessions[uuid]
    raw_data = sp['buffer']
    bend = sp['end']
    bstart = bend-len(raw_data)

    i=0 # on data buffer, where to start
    if start is not None:
        if start<bstart:
            raise Exception("Data not in buffer")
        elif start>bend:
            i=len(raw_data) # just end
        else:
            i=start-bstart
    raw_data=raw_data[i:]
    if encoding=='b64':
        data = str( base64.encodestring(raw_data), 'ascii' )
    else:
        data = str( raw_data, encoding )
    return {'end': bend, 'data': data }

port_to_pexpect={}

@serverboards.rpc_method
def open_port(url, hostname="localhost", port="22"):
    """
    Opens a connection to a remote ssh server on the given hostname and port.

    This will make a local port accesible that will be equivalen to the remote
    one. The local one is random.

    Arguments:
        url --  The ssh server url, as ssh://[username@]hostname[:port], or
                simple hostname
        hostname -- Remote hostname to connect to. Default `localhost` which
                would be the SSH server
        port -- Remote port to connect to

    Returns:
     localport -- Port id on Serverboards side to connect to.
    """
    (opts, url) = url_to_opts(url)
    keep_trying=True
    while keep_trying:
        localport=random.randint(20000,60000)
        mopts=opts+["-nNT","-L","%s:%s:%s"%(localport, hostname, port)]
        sp=pexpect.spawn("/usr/bin/ssh",mopts)
        port_to_pexpect[localport]=sp
        running=True
        while running:
            ret=sp.expect([str('^(.*)\'s password:'), str('Could not request local forwarding.'), pexpect.EOF, pexpect.TIMEOUT], timeout=2)
            if ret==0:
                if not url.password:
                    raise Exception("Need password")
                    sp.sendline(url.password)
            if ret==1:
                running=False
                del port_to_pexpect[localport]
            if ret==2:
                keep_trying=False
                running=False
            if ret==3:
                keep_trying=False
                running=False
    serverboards.debug("Port redirect localhost:%s -> %s:%s"%(localport, hostname, port))
    return localport

@serverboards.rpc_method
def close_port(port):
    """
    Closes a remote connected port.

    Uses the local port as identifier to close it.
    """
    port_to_pexpect[port].close()
    del port_to_pexpect[port]
    serverboards.debug("Closed port redirect localhost:%s"%(port))
    return True

if __name__=='__main__':
    if len(sys.argv)==2 and sys.argv[1]=='test':
        #print(ssh_exec("localhost","ls -l | tr -cs '[:alpha:]' '\\\\n' | sort | uniq -c | sort -n"))
        #print(ssh_exec("ssh://localhost:22","ls -l | tr -cs '[:alpha:]' '\\\\n' | sort | uniq -c | sort -n"))
        import time
        localhost = open("localhost")
        send(localhost,"ls /tmp/\n")
        time.sleep(1.000)
        print()
        print(recv(localhost))
        print()
    else:
        serverboards.loop()
