#!/bin/python
import serverboards, passwdfile, sys

pwf=passwdfile.PasswdFile("/tmp/htishpasswd")

@serverboards.rpc_method
def auth(email, password):
    if pwf.check(email, password):
        return email
    return False

@serverboards.rpc_method
def set_password(email, password):
    pwf.update(email, password)
    return True

## Run tests with: python -m doctest htpasswd-auth.py

if __name__=='__main__':
    if len(sys.argv)>1:
        check=False
        options=sys.argv[1:]
        import getpass
        for user in options:
            if user=='--check':
                print("Entering in check mode")
                check=True
            else:
                print(user)
                pw=getpass.getpass()
                if check:
                    print( pwf.check(user, pw) )
                else:
                    pwf.update(user, pw)
    else:
        serverboards.loop()
