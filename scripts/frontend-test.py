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
         envset(MIX_ENV="prod", SERVERBOARDS_DATABASE_URL=dburl, SERVERBOARDS_TCP_PORT="4040", SERVERBOARDS_INI="test/plugins.ini"), \
         running("mix", "run", "--no-halt", _out="log/serverboards.txt", _err_to_out=True, _cwd="backend"):
        printc("WAIT FOR RUNNING BACKEND", color="blue")
        wait_for_port(8080, timeout=20)
        printc("CREATE USER", color="blue")
        create_user(dburl, token)
        fail = False

        with chdir("frontend"):
            sh.rm("-rf", "shots")
            sh.mkdir("-p", "shots")

        printc("MAKE FRONTEND", color="blue")
        with chdir("frontend"):
            sh.make("compile", _out="../log/compile.txt")

        printc("UNIT TESTS", color="blue")
        try:
            with chdir("frontend"):
                sh.npm.test(_out="../log/unit_tests.txt")
            printc("PASS UNIT TESTS", color="green")
        except:
            with open("log/unit_tests.txt","r") as fd:
                print(fd.read())
            printc("FAIL UNIT TESTS", color="red")
            fail = True
        printc("UI TESTS", color="blue")
        try:
            with chdir("frontend"), running("Xvfb",":5"), envset(DISPLAY=":5"):
                sh.Command("node_modules/.bin/wdio")("wdio.conf.js", _out="../log/wdio.txt")
            printc("PASS UI TESTS", color="green")
        except:
            with open("log/wdio.txt","r") as fd:
                print(fd.read())
            printc("FAIL UI TESTS", color="red")
            fail=True
        if fail:
            printc("FAIL", color="red")
        else:
            printc("SUCCESS", color="GREEN")



if __name__=='__main__':
    main()
