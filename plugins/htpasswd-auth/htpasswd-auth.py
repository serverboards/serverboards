#!/usr/bin/python

# setup use of bindings
import sys
sys.path.append('../bindings/python/')

import serverboards, passwdfile

pwf=passwdfile.PasswdFile( serverboards.config.file("auth/htpasswd") )

@serverboards.rpc_method
def auth(email, password):
    if pwf.check(email, password):
        return email
    return False

@serverboards.rpc_method
def set_password(email, password):
    pwf.update(email, password)
    return True

def cmd_mode(options):
    check=True
    import getpass
    for user in options:
        if user=='--set':
            print("Entering in check mode")
            check=False
        elif user=='--list':
            print("users")
            print("----------")
            print('\n'.join(pwf.list()))
        else:
            if check:
                print("Check %s password"%user)
                pw=getpass.getpass()
                print( pwf.check(user, pw) )
            else:
                print("Set %s password"%user)
                pw=getpass.getpass()
                pwf.update(user, pw)


## Run tests with: python -m doctest htpasswd-auth.py
if __name__=='__main__':
    if len(sys.argv)>1:
        cmd_mode(sys.argv[1:])
    else:
        serverboards.loop()
