#!/bin/python3
import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__),'../bindings/python/'))
import serverboards, pexpect, shlex, re, subprocess
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
    sp=pexpect.spawn("/usr/bin/ssh",opts + ['--'] + shlex.split(command))
    running=True
    while running:
        ret=sp.expect([re.compile('^(.*)\'s password:'), pexpect.EOF])
        data=sp.before
        if ret==1:
            running=False
        elif ret==0:
            if not url.password:
                raise Exception("Need password")
            sp.sendline(url.password)
    sp.wait()
    return {"stdout": data, "exit": sp.exitstatus}

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
    serverboards.rpc.debug(repr(opts))
    #sp=pexpect.spawn("/usr/bin/ssh",opts)
    sp=subprocess.Popen(["/usr/bin/ssh"] + opts,
        stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    _uuid = str(uuid.uuid4())
    sessions[_uuid]=dict(process=sp, buffer=b"", end=0, uidesc=uidesc)

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
    sp=sessions[uuid]['process']
    if not data:
        data=base64.decodestring(bytes(data64,'ascii'))
    else:
        data=bytes(data, 'ascii')
    #ret = sp.send(data)
    ret = os.write( sp.stdin.fileno(), data )
    return ret

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
    serverboards.rpc.debug(repr(sessions))
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
        serverboards.loop( debug = None )
