#!/usr/bin/python3

import sys, pam, grp, pwd, os
sys.path.append(os.path.join(os.path.dirname(__file__),'../bindings/python/'))
import serverboards

p = pam.pam()

@serverboards.rpc_method
def auth(type="pam", email=None, password=None, **kwargs):
    serverboards.debug("Params: %s"%repr(kwargs))
    password_ok = p.authenticate(email, password, "serverboards")
    if not password_ok:
        serverboards.debug("Login NOK")
        return False
    serverboards.debug("Login OK, getting data")
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
