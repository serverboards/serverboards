#!/usr/bin/python3
"""
Runs each of the backend tests in its own newly created database.

This allows them to run in parallel, and save a lot of time.

(from 3m49s to 1m)
"""


import sh, os, random, sys, time
from multiprocessing import Pool

TEST_DIR='backend/apps/serverboards/test/'
DESTROY_DB_USERS="""
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '{DBNAME}';

drop database {DBNAME};
"""

def printc(*s, color=None, hl=None, bg=None, **kwargs):
    """
    Prints some text with some color, using Terminal escape sequences

    >>> printc("Hello world", color="blue")
    \033[1;34mHello world\033[1;m
    >>> printc("Hello world", color="blue", hl=True)
    \033[1;44mHello world\033[1;m

    """
    colors = {
        'grey':30,
        'black':31,
        'red':31,
        'green':32,
        'yellow':33,
        'blue':34,
        'magenta':35,
        'purple':35,
        'cyan':36,
        }
    code=colors.get(color)
    text=' '.join(str(x) for x in s)
    if code:
        hl = 1 if hl else 0
        if bg:
            code+=10
        print("\033[{hl};{color}m{text}\033[1;m".format(hl=hl, text=text, color=code), **kwargs)
    else:
        print(text, **kwargs)
    sys.stdout.flush()

def compile(logfile=sys.stdout):
    with chdir("backend/"), envset(MIX_ENV="test"):
        sh.mix("deps.get", _out=logfile, _err=logfile)
        sh.make("-f", "Makefile.hacks", "compile", _out=logfile, _err=logfile)

    with chdir("backend/apps/serverboards/"), envset(MIX_ENV="test"):
        sh.mix("compile", _out=logfile, _err=logfile)

def test(args):
    test, origdb = args
    end=0
    start=0
    with open("log/%s.txt"%test,"wb") as logfile:
        testname = os.path.join("test/",test)

        dbname='sbds_'+(''.join(random.choice('abcdefghijklmnopqrst123467890') for _ in range(10)))
        printc("test \t%32s \t\tDB %s"%(test, dbname), color="blue")
        envs = dict(
            MIX_ENV="test",
            SERVERBOARDS_PATH=os.getcwd()+"/local/",
            SERVERBOARDS_DATABASE_URL="postgresql://serverboards:serverboards@localhost/"+dbname
            )
        with copytmpdb(origdb, dbname), chdir("backend/apps/serverboards/"), envset(**envs):
            start = time.time()
            try:
                sh.mix.run("priv/repo/test_seeds.exs", _out=logfile, _err=logfile)
                sh.mix.test(testname, _out=logfile, _err=logfile)
            except:
                end = time.time()
                printc("FAIL \t%32s\t\t%.2f s"%(test, end-start), color="red")
                return (False, end-start)
            end = time.time()

    with open("log/%s.txt"%test,"r") as logfile:
        output=logfile.read()
        if "Compiling" in output:
            printc("WARNING \t%32s\tRECOMPILATION", color="yellow")
        if "Test patterns did not match any file:" in output:
            printc("FAIL \t%32s\t\tMAY NOT HAVE BEEN RUN"%test, color="red")
            return (False, end-start)
    printc("PASS \t%32s\t\t%.2f s"%(test, end-start), color="green")
    return (True, end-start)

def main():
    sh.mkdir("-p","log")
    try:
        os.unlink("logfile.txt")
    except:
        pass

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

    tests = [x for x in os.listdir(TEST_DIR) if x.endswith('_test.exs')]
    failures=0
    allok = []
    accumulated_time=(end-start) # count also compilation time
    with Pool() as p:
        dbname='sbds_'+(''.join(random.choice('abcdefghijklmnopqrst123467890') for _ in range(10)))
        printc("TEMPORAL DB TEMPLATE", color="blue")
        with tmpdb(dbname):
            printc("%d TESTS"%len(tests), color="blue")
            allok = p.map(test, [(t, dbname) for t in tests])
        accumulated_time=sum( x[1] for x in allok )
        allok = [x[0] for x in allok]
        print( allok )
        failures = len( [x for x in allok if not x] )
    end = time.time()
    if failures>0:
        print()
        ff = tests[ allok.index(False) ]
        output = [x for x in open( "log/%s.txt"%ff ).readlines() if x.startswith(" ")][-40:]
        printc("\n-- FIRST FAILURE %s --"%ff, color="red", bg=True)
        print("----------------------------------------------------------------------")
        print(''.join(output))
        print("----------------------------------------------------------------------")
        printc("Fail at: ", ' '.join([t for t, ok in zip(tests, allok) if not ok]), color="red")
        printc("FAILURES %d/%d\tTOTAL TIME %.2f s / SAVED %.2f s"%(failures, len(tests), end-start, accumulated_time-(end-start)), color="red")
        sys.exit(1)
    printc("ALL PASS\tTOTAL TIME %.2f s / SAVED %.2f s"%(end-start, accumulated_time-(end-start)), color="green")
    print()
    sys.exit(0)

class chdir:
    """
    Step into a directory temporarily.
    """
    def __init__(self, path):
        self.old_dir = os.getcwd()
        self.new_dir = path

    def __enter__(self):
        os.chdir(self.new_dir)

    def __exit__(self, *args):
        os.chdir(self.old_dir)

class envset:
    def __init__(self, **envs):
        self.envs=envs
    def __enter__(self):
        self.oldenv={}
        for k,v in self.envs.items():
            self.oldenv[k]=os.environ.get(k)
            os.environ[k]=v
    def __exit__(self, *args):
        for k,v in self.oldenv.items():
            if not v:
                del os.environ[k]
            else:
                os.environ[k]=v
class tmpdb:
    def __init__(self, dbname):
        self.dbname=dbname
    def __enter__(self):
        sh.createdb(self.dbname, _out="log/create-tmpdb.txt")
        sh.psql(self.dbname,"-f", "backend/apps/serverboards/priv/repo/initial.sql", _out="log/create-tmpdb.txt")
        printc("UPDATE TEMPLATE DB", color="blue")
        with envset(MIX_ENV="test"), chdir("backend"):
            sh.mix("run", "apps/serverboards/priv/repo/test_seeds.exs", _out="../log/create-tmpdb.txt")
    def __exit__(self, *args):
        # print("Wipe out db %s %s"%(self.dbname, DESTROY_DB_USERS.format(DBNAME=self.dbname)))
        sh.psql("template1", _in=DESTROY_DB_USERS.format(DBNAME=self.dbname))
class copytmpdb:
    def __init__(self, orig, dbname):
        self.orig=orig
        self.dbname=dbname
    def __enter__(self):
        sh.createdb(self.dbname,"-T",self.orig, _out="log/create-copytmpdb.txt")
    def __exit__(self, *args):
        # print("Wipe out db %s %s"%(self.dbname, DESTROY_DB_USERS.format(DBNAME=self.dbname)))
        sh.psql("template1", _in=DESTROY_DB_USERS.format(DBNAME=self.dbname))

if __name__=='__main__':
    main()
