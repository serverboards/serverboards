#!/usr/bin/python3
"""
Runs each of the backend tests in its own newly created database.

This allows them to run in parallel, and save a lot of time.

(from 3m49s to 1m)
"""
import sh
import os
import sys
import time
from multiprocessing import Pool
from tests_common import random_dbname, printc, copytmpdb, chdir, envset
from tests_common import tmpdb, compile


TEST_DIR = 'backend/apps/serverboards/test/'


def test(args):
    test, origdb = args
    end = 0
    start = 0
    with open("log/%s.txt" % test, "wb") as logfile:
        testname = os.path.join("test/", test)

        dbname = random_dbname()
        printc("test \t%32s \t\tDB %s" % (test, dbname), color="blue")
        envs = dict(
            MIX_ENV="test",
            SERVERBOARDS_PATH=os.getcwd() + "/local/",
            SERVERBOARDS_DATABASE_URL=(
                "postgresql://serverboards:serverboards@localhost/" + dbname
            )
        )
        with copytmpdb(origdb, dbname), \
                chdir("backend/apps/serverboards/"), \
                envset(**envs):
            start = time.time()
            try:
                sh.mix.run(
                    "priv/repo/test_seeds.exs", _out=logfile, _err=logfile)
                sh.mix.test(testname, _out=logfile, _err=logfile)
            except Exception:
                end = time.time()
                printc("FAIL \t%32s\t\t%.2f s" % (test, end - start),
                       color="red")
                return (False, end - start)
            end = time.time()

    with open("log/%s.txt" % test, "r") as logfile:
        output = logfile.read()
        if "Compiling" in output:
            printc("WARNING \t%32s\tRECOMPILATION", color="yellow")
        if "Test patterns did not match any file:" in output:
            printc("FAIL \t%32s\t\tMAY NOT HAVE BEEN RUN" % test, color="red")
            return (False, end - start)
    printc("PASS \t%32s\t\t%.2f s" % (test, end - start),
           color="green")
    return (True, end - start)


def main():
    sh.mkdir("-p", "log")

    printc("COMPILING", color="blue")
    start = time.time()
    try:
        compile(logfile=open("log/compile.txt", "wb"))
    except Exception:
        printc("ERROR COMPILING", color="red")
        with open("log/compile.txt") as fd:
            print(fd.read())
            sys.exit(1)
    end = time.time()

    tests = [x for x in os.listdir(TEST_DIR) if x.endswith('_test.exs')]
    failures = 0
    allok = []
    accumulated_time = (end - start)  # count also compilation time
    with Pool() as p:
        dbname = random_dbname()
        printc("TEMPORAL DB TEMPLATE", color="blue")
        with tmpdb(dbname):
            printc("%d TESTS" % len(tests), color="blue")
            allok = p.map(test, [(t, dbname) for t in tests])
        accumulated_time = sum(x[1] for x in allok)
        allok = [x[0] for x in allok]
        print(allok)
        failures = len([x for x in allok if not x])
    end = time.time()
    if failures > 0:
        print()
        ff = tests[allok.index(False)]
        output = [x for x in
                  open("log/%s.txt" % ff).readlines()
                  if x.startswith(" ")][-40:]
        printc("\n-- FIRST FAILURE %s --" % ff, color="red", bg=True)
        print("--------------------------------------------------------------")
        print(''.join(output))
        print("--------------------------------------------------------------")
        failures = ' '.join([t for t, ok in zip(tests, allok) if not ok])
        printc("Fail at: ", failures, color="red")
        printc("FAILURES %d/%d\tTOTAL TIME %.2f s / SAVED %.2f s" %
               (failures, len(tests), end - start,
                accumulated_time - (end - start)),
               color="red")
        sys.exit(1)
    printc("ALL PASS\tTOTAL TIME %.2f s / %.2f s (%.2f%%)" % (
           end - start, accumulated_time,
           (end - start) * 100 / accumulated_time), color="green")
    print()
    sys.exit(0)


def main_all_at_once():
    sh.mkdir("-p", "log")
    fail = False

    printc("COMPILING", color="blue")
    start = time.time()
    try:
        compile(logfile=open("log/compile.txt", "wb"))
    except Exception:
        printc("ERROR COMPILING", color="red")
        with open("log/compile.txt") as fd:
            print(fd.read())
            sys.exit(1)
    end = time.time()
    accumulated_time = (end - start)  # count also compilation time

    dbname = random_dbname()
    envs = dict(
        MIX_ENV="test",
        SERVERBOARDS_PATH=os.getcwd() + "/local/",
        SERVERBOARDS_DATABASE_URL=(
            "postgresql://serverboards:serverboards@localhost/" + dbname
        )
    )

    with envset(**envs), tmpdb(dbname), chdir("backend/apps/serverboards/"):
        start = time.time()
        printc("RUN TESTS", color="blue")
        try:
            assert os.system("mix run priv/repo/test_seeds.exs") == 0
            assert os.system("mix test") == 0
        except Exception:
            import traceback
            traceback.print_exc()
            fail = True
        except sh.ErrorReturnCode_1:
            fail = True
        end = time.time()
        accumulated_time += (end - start)
    printc("Done", color="grey", hl=True)

    printc("Elapsed time: %d:%02d" %
           (accumulated_time / 60, accumulated_time % 60),
           color="grey", hl=True)
    if fail:
        printc("FAIL", color="red")
        sys.exit(1)
    else:
        printc("SUCCESS", color="green")
        sys.exit(0)


if __name__ == '__main__':
    main_all_at_once()
