import sh, os, random, sys, socket, time

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

def compile(logfile=sys.stdout, MIX_ENV="test"):
    with chdir("backend/"), envset(MIX_ENV=MIX_ENV):
        sh.mix("deps.get", _out=logfile, _err=logfile)
        sh.make("-f", "Makefile.hacks", "compile", _out=logfile, _err=logfile)

    with chdir("backend/apps/serverboards/"), envset(MIX_ENV=MIX_ENV):
        sh.mix("compile", _out=logfile, _err=logfile)

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
        printc("CREATE DB %s"%self.dbname, color="blue")
        sh.createdb(self.dbname, _out="log/create-tmpdb.txt")
        sh.psql(self.dbname,"-f", "backend/apps/serverboards/priv/repo/initial.sql", _out="log/create-tmpdb.txt")
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
class running:
    def __init__(self, command, *args, **kwargs):
        self.command=command
        self.args=args
        self.kwargs=kwargs
    def __enter__(self):
        self.process=sh.Command(self.command)(*self.args, **self.kwargs, _bg=True, _ok_code=range(16))
    def __exit__(self, *args):
        printc("terminating %s..."%(self.command), color="grey", hl=True)
        try:
            tmp = sh._SelfWrapper__self_module.SIGNALS_THAT_SHOULD_THROW_EXCEPTION # hack do not throw, please
            sh._SelfWrapper__self_module.SIGNALS_THAT_SHOULD_THROW_EXCEPTION=set([])
            self.process.terminate()
            self.process.wait()
            sh._SelfWrapper__self_module.SIGNALS_THAT_SHOULD_THROW_EXCEPTION=tmp
        except Exception as e:
            printc("TERMINATED %s: %s"%(self.command, str(e)), color="blue")


def random_dbname():
    return 'sbds_'+(''.join(random.choice('abcdefghijklmnopqrst123467890') for _ in range(10)))

def wait_for_port(port, timeout=300):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    for i in range(timeout):
        result = sock.connect_ex(('127.0.0.1',port))
        printc("try connect %s -> %s"%(port, result), color="grey", hl=True)
        if result == 0:
            sock.close()
            return True
        time.sleep(1)
    sock.close()
    raise Exception("Port did not appear in %d seconds"%timeout)

def create_user(database_url, token, logfile="log/createuser.txt"):
    sqls = ["""
INSERT INTO auth_user (id, email, name, is_active, inserted_at, updated_at)
  VALUES
  (1, '{username}', 'Test User', true, NOW(), NOW());
""","""
SELECT * FROM auth_user;
""","""
INSERT INTO auth_user_password (user_id, password, inserted_at, updated_at)
  VALUES
  (1, '$bcrypt$$2b$12$mFXChDI63yh1WPR./gJjk.vq7U3Q/r1xjtgmLJhDhPoaZd650pAny', NOW(), NOW());
SELECT * FROM auth_user_password
""","""
INSERT INTO auth_user_token
  (user_id, token, perms, time_limit, inserted_at, updated_at)
  VALUES
  (1, '{token}', NULL, NOW() + '30 minutes'::interval, NOW(), NOW());
""","""
SELECT * FROM auth_user_token;
""","""
INSERT INTO auth_user_group
  (user_id, group_id)
  VALUES
  (1, 1),
  (1, 2);

SELECT * FROM auth_user_group;
"""]
    for sql in sqls:
        sql = sql.format(username="test@serverboards.io", token=token)
        #printc(sql, color="blue")
        sh.psql(database_url, _in=sql, _out=logfile, _err=logfile)
