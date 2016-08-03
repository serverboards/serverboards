#!/bin/python3
import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__),'../bindings/python/'))
import serverboards, pexpect, shlex, re
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
    with open(ID_RSA_PUB,'r') as fd:
        return fd.read()

sessions={}
import uuid

@serverboards.rpc_method
def open(url):
    (opts, url) = url_to_opts(url)
    opts += ['--', '/bin/bash']
    serverboards.rpc.debug(repr(opts))
    sp=pexpect.spawn("/usr/bin/ssh",opts)
    _uuid = uuid.uuid4().hex
    sessions[_uuid]=sp
    return _uuid

@serverboards.rpc_method
def send(uuid, data):
    sp=sessions[uuid]
    ret = sp.send(bytes(data, 'ascii'))
    return ret

@serverboards.rpc_method
def sendline(uuid, data):
    return send(uuid, data+'\n')

@serverboards.rpc_method
def recv(uuid):
    sp=sessions[uuid]
    try:
        data = sp.read_nonblocking(128,0)
    except pexpect.exceptions.TIMEOUT:
        data = b''
    except:
        import traceback; traceback.print_exc()
        raise
    return str( base64.encodestring(data), 'ascii' )

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
