#!/usr/bin/python3

import os, sh, sys, time, uuid
from tests_common import *

def main():
    sh.mkdir("-p","log")
    sh.fuser("-k","-n","tcp","4040", _ok_code=[0,1])

    printc("COMPILE FRONTEND", color="blue")
    with chdir("frontend"):
        sh.make("compile", _out="../log/compile.txt")

    printc("UNIT TESTS", color="blue")
    fail = False
    try:
        with chdir("frontend"):
            sh.npm.test(_out="../log/unit_tests.txt")
        printc("PASS UNIT TESTS", color="green")
    except:
        with open("log/unit_tests.txt","r") as fd:
            print(fd.read())
        printc("FAIL UNIT TESTS", color="red")
        fail = True

    if fail:
        printc("FAIL", color="red")
        sys.exit(1)
    else:
        printc("SUCCESS", color="green")
    sys.exit(0)



if __name__=='__main__':
    main()
