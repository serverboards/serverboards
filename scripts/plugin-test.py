#!/usr/bin/python3

import os, sh, sys, time, uuid
from tests_common import *

def main():
    sh.mkdir("-p","log")

    printc("COMPILING", color="blue")
    start = time.time()
    try:
        compile(logfile=open("log/compile.txt","wb"))
    except:
        printc("ERROR COMPILING", color="red")
        with open("log/compile.txt") as fd:
            print( fd.read() )
            sys.exit(1)
    end = time.time()

    token = uuid.uuid4()
    fail = False
    dbname = random_dbname()
    dburl = "postgresql://serverboards:serverboards@localhost/%s"%dbname

    with tmpdb(dbname), \
         envset(MIX_ENV="test", SERVERBOARDS_DATABASE_URL=dburl, SERVERBOARDS_TCP_PORT="4040", SERVERBOARDS_INI="test/plugins.ini"), \
         running("mix", "run", "--no-halt", _out="log/serverboards.txt", _err_to_out=True, _cwd="backend"):
        printc("WAIT FOR PORT", color="blue")
        wait_for_port(4040, timeout=20)
        printc("CREATE USER", color="blue")
        create_user(dburl, token)
        printc("TESTS", color="blue")
        with chdir("cli"):
            try:
                sh.make()
                sh.Command("./s10s-plugin-test.py")("--auth-token", token, _out=sys.stdout.buffer, _err_to_out=True)
            except sh.ErrorReturnCode_1:
                fail=True
            except:
                import traceback
                traceback.print_exc()
                fail=True
    if fail:
        print()
        printc("FAILED", color="red")
        sys.exit(1)
    sys.exit(0)

if __name__=='__main__':
    main()
