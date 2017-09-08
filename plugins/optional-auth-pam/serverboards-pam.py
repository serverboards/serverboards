#!/usr/bin/python3

import sys, grp, pwd, os, subprocess
sys.path.append(os.path.join(os.path.dirname(__file__),'../bindings/python/'))
import serverboards


def authenticate(username, password):
    helper = os.path.abspath(os.path.join(os.path.dirname(__file__),"./serverboards-auth-helper"))
    serverboards.debug("Using PAM helper %s"%(helper))
    sp = subprocess.Popen(["sudo", "-n", helper], stdin=subprocess.PIPE)
    sp.stdin.write(bytes("%s\n%s\n"%(username,password), 'utf8'))
    sp.stdin.flush()
    sp.stdin.close()
    return sp.wait() == 0

@serverboards.rpc_method
def auth(type="pam", email=None, password=None, **kwargs):
    password_ok = authenticate(email, password)
    if not password_ok:
        serverboards.debug("Login NOK")
        return False
    serverboards.debug("PAM login OK for %s, getting data"%(email))
    groups = [g.gr_name for g in grp.getgrall() if email in g.gr_mem]
    groups = [ g[13:] if g.startswith('serverboards-') else g for g in groups ]

    name = pwd.getpwnam(email).pw_gecos

    return {
        "email" : email,
        "name" : name,
        "groups" : list(set(groups))
    }



if __name__=='__main__':
    serverboards.loop()
