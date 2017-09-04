#!/usr/bin/python3
"""
Runs each of the backend tests in its own newly created database.

This allows them to run in parallel, and save a lot of time.

(from 3m49s to 1m)
"""


import sh, os, random, sys
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

def compile(logfile=sys.stdout):
    print("Compiling...")
    with chdir("backend"), envset(MIX_ENV="test"):
        res=sh.make("compile", _out=logfile, _err=logfile)

def test(test):
    testname = os.path.join(TEST_DIR,test)
    logfile = open("log/%s.log"%test,"wb")

    dbname='sbds_'+(''.join(random.choice('abcdefghijklmnopqrst123467890') for _ in range(10)))
    printc("test \t%32s \t\t db %s"%(test, dbname), color="blue")
    envs = dict(
        MIX_ENV="test",
        SERVERBOARDS_PATH=os.getcwd()+"/local/",
        SERVERBOARDS_DATABASE_URL="postgresql://serverboards:serverboards@localhost/"+dbname
        )
    with tmpdb(dbname), chdir("backend"), envset(**envs):
        try:
            sh.mix.run("apps/serverboards/priv/repo/test_seeds.exs", _out=logfile, _err=logfile)
            sh.mix.test(testname, _out=logfile, _err=logfile)
        except:
            printc("FAIL \t%32s"%test, color="red")
            return False
        printc("PASS \t%32s"%test, color="green")
        return True

def main():
    sh.mkdir("-p","log")
    try:
        os.unlink("logfile.txt")
    except:
        pass
    compile(logfile=open("log/compile.log","wb"))
    tests = [x for x in os.listdir(TEST_DIR) if x.endswith('_test.exs')]
    failures=0
    with Pool() as p:
        allok = p.map(test, tests)
        print( allok )
        failures = len( [x for x in allok if not x] )
    print("Failures %s"%failures)
    if failures>0:
        sys.exit(1)
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
        sh.createdb(self.dbname)
        sh.psql(self.dbname,"-f", "backend/apps/serverboards/priv/repo/initial.sql")
    def __exit__(self, *args):
        # print("Wipe out db %s %s"%(self.dbname, DESTROY_DB_USERS.format(DBNAME=self.dbname)))
        sh.psql("template1", _in=DESTROY_DB_USERS.format(DBNAME=self.dbname))

if __name__=='__main__':
    main()
