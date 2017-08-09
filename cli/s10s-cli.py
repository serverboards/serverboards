#!/usr/bin/python3

import readline, sys, shlex, json, select, os, atexit, time, math, socket
import subprocess, fcntl, getpass, base64
from io import StringIO
DEBUG=False
PENDING="66509317-642c-4670-a2ef-78155e32c4a9" # to be unique, not confuse with any response
PASS="c0deb94a-4cc1-40a1-bffb-e935b0747ae3"

start_time=time.time()
def time_since_start():
    return time.time()-start_time

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

def debugc(*s, **kwargs):
    """
    Same as printc, but to stderr

    >>> sys.stderr=sys.stdout # to force on stdout
    >>> debugc("Test")
    Test

    """
    printc(*s, file=sys.stderr, **kwargs)


class IOClient:
    """
    IO Client Connection.

    >>> client=Client(socket.create_connection(("localhost", "4040")))
    >>> client.call_line('version')['result']
    '0.0.1'
    >>> client.call_line('method.unknown params')['error']
    'unknown_method'
    >>> client.call_line('!version') # event call
    >>> client.call_line('@dir') # force remote call, if name collision with internal

    """
    def __init__(self):
        self.maxid=1
        self._debug=False
        self.connections=[]

    def connect_to(self, fn):
        """
        Whenever this client receives a call from its own end, it will check the
        conditions at connections, and if True, calls the fn.

        fn(cmd, replyf)

        The fn must call the replyf only if it processes the request, and return True.

        replyf({id, result|error})

        None means that the answer can not be given right now, will be given
        later.
        """
        self.connections.append(fn)
        return self

    def set_debug(self, _on=True, **kwargs):
        if _on=='all':
            global DEBUG
            DEBUG=True
            self.debug("Setting GLOBAL debug ON!")
        else:
            self._debug=_on
            self.debug("Setting debug %s"%_on)
        return True

    def debug(self, *txt, **kwargs):
        if DEBUG or self._debug:
            extra_args={"color": "purple", "hl":False}
            extra_args.update(kwargs)
            printc("[%.2f] %s:"%(time_since_start(), self.__class__.__name__), *txt, **extra_args)

    def recv_and_parse(self):
        some=False
        for cmd in self.readcmds():
            if cmd: # might be none to mark something was read, but no processing required. Needed to know if should try again to select on fds.
                self.recv_and_parse_one(cmd)
            some=True
        return some

    def reply(self, reply):
        raise NotImplementedError()

    def recv_and_parse_one(self, cmd):
        for fn in self.connections:
            self.debug("Try call into %s"%(fn.__name__),cmd, hl=True)
            try:
                ret = fn(cmd, self.reply)
                if ret:
                    return ret
            except Exception as e:
                import traceback; traceback.print_exc()
                if cmd.get('id'):
                    self.reply({
                            "id": cmd.get("id"),
                            "error": str(e)
                        })
        if cmd.get("id"):
            self.reply({"id": cmd.get("id"), "error": "unknown_method"})
        self.debug("CMD not processed: %s"%repr(cmd))
        return False

class CoreClient(IOClient):
    METHOD_WHITELIST=["dir","ping","version"]
    def __init__(self):
        s = socket.create_connection(("localhost", "4040"))
        s.setblocking(False)
        self.socket=s
        self.buffer=StringIO()
        self.pending_replies={}
        super().__init__()

    def fileno(self):
        return self.socket.fileno()

    def reply(self, reply):
        self.debug("reply>>> %s"%cmd)
        self.socket.send(bytearray(json.dumps(reply)+'\n','utf8'))

    def readcmds(self):
        for cmd in self.readcmds_unfiltered():
            if not cmd:
                yield None
                continue
            if 'result' in cmd or 'error' in cmd:
                id = cmd.get('id')
                if id in self.pending_replies:
                  self.pending_replies[id](cmd)
                  del self.pending_replies[id]
                else:
                  printc("Error, received not expeceted reply for message %s. Waiting for %s"%(id, list(self.pending_replies.keys())))
                yield None # mark something hapened, not a command
            else:
                if 'id' in cmd:
                    self.pending_requests[cmd['id']]=cmd
                yield cmd

    def readcmds_unfiltered(self):
        data = self.socket.recv(32*1024).decode('utf8')
        self.debug("read>>> %s"%(data))
        if '\n' in data:
            datal=data.split("\n")
            line = (self.buffer.getvalue()+datal[0]).strip()
            try:
                yield json.loads(line)
            except:
                printc("Error reading line: %s"%(repr(line)), color="red")
                raise
            for l in datal[1:-1]:
                line = l.strip()
                yield json.loads(line)
            self.buffer=StringIO(datal[-1])
        else:
            self.buffer.write(data)
            yield None

    def send(self, cmd, replyf):
        method = cmd.get('method')
        assert method
        if method[0]=="@":
          method=method[1:]
          cmd=dict(cmd)
          cmd["method"]=method

        if not '.' in method and not method in self.METHOD_WHITELIST:
            return None # ignore if no .

        id = cmd.get('id')
        if id:
            self.pending_replies[id]=replyf
            self.debug("Send to core>>> %s"%cmd)
        else:
            self.debug("Send event to core>>> %s"%cmd)

        self.socket.send(bytearray(json.dumps(cmd)+'\n','utf8'))
        return True

class CmdClient(IOClient):
    def __init__(self, command):
        super().__init__()
        self.process=subprocess.Popen(
            command,
            bufsize=1, # line buffered
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            )
        fcntl.fcntl(
            self.process.stdout.fileno(),
            fcntl.F_SETFL,
            fcntl.fcntl(self.process.stdout.fileno(), fcntl.F_GETFL) | os.O_NONBLOCK
            )

        self.pending_cmds={}
        self.buffer = StringIO()

    def fileno(self):
        return self.process.stdout.fileno()

    def call_into_command(self, cmd, replyf):
        method = cmd.get("method")
        if not method:
            replyf = self.pending_cmds.get(cmd.get('id'))
            replyf(cmd)
            return True

        if '.' in method:
            return # not for me, for core
        self.debug("to command>> %s"%(cmd))

        id = cmd.get("id")
        if id:
            if id in self.pending_cmds:
                raise Exception("Already waiting for that id!")
            self.pending_cmds[id]=replyf

        self.process.stdin.write( (json.dumps(cmd) + "\n").encode('utf8') )
        self.process.stdin.flush()
        return True

    def reply(self, reply):
        self.debug("reply to command> %s"%(reply))
        if reply.get('id') != None:
            self.process.stdin.write( (json.dumps(reply) + "\n").encode('utf8') )
            self.process.stdin.flush()

    def readcmds(self):
        for cmd in self.readcmds_unfiltered():
            if not cmd:
                yield None
                continue
            id = cmd.get('id')
            if 'error' in cmd or 'result' in cmd and id in self.pending_cmds:
                self.pending_cmds[id](cmd)
                yield None
            else:
                yield cmd

    def readcmds_unfiltered(self):
        data = self.process.stdout.read().decode('utf8')
        self.debug("read>>> %s"%repr(data))
        if not data:
            time.sleep(0.5)
            return
        if '\n' in data:
            datal=data.split("\n")
            line = (self.buffer.getvalue()+datal[0]).strip()
            try:
                yield json.loads(line)
            except:
                printc("Error reading line: %s"%(repr(line)), color="red")
                raise
            for l in datal[1:-1]:
                line = l.strip()
                yield json.loads(line)
            self.buffer=StringIO(datal[-1])
        else:
            self.buffer.write(data)
            yield None


    def close(self):
        """
        Terminates the command, and after 1s kills it.

        TODO Use wait with timeout to kill it.
        """
        try:
            self.process.terminate()
            for i in range(20):
                time.sleep(0.1)
                if self.process.poll():
                    return
            self.process.kill()
        except OSError:
            pass


class CliClient(IOClient):
    def __init__(self, interactive=True, stdin=sys.stdin, stdout=sys.stdout):
        self.stdin=stdin
        self.stdout=stdout
        self.vars={}
        self.interactive=interactive
        self.builtin={
            's': self.builtin_set,
            'set': self.builtin_set,
            'unset': self.builtin_unset,
            'vars': lambda _id:self.vars,
            'debug': self.set_debug,
            'print': lambda x, _id: x,
            'p': lambda x, _id: x,
            'import': lambda filename, _id: self.parse_file(filename),
            'dir':self.builtin_dir,
            'command':self.run_command,
            'sleep':self.builtin_sleep,
            'pending':self.builtin_pending,
            'assert':self.builtin_assert,
            'b64decode':lambda data, _id: base64.b64decode(data.encode('ascii')).decode('ascii'),
            'b64encode':lambda data, _id: base64.b64encode(data.encode('ascii')).decode('ascii'),
        }
        self.internal={
            'log.error':self.internal_log('red'),
            'log.info':self.internal_log('white'),
            'log.debug':self.internal_log('blue'),
            'log.warning':self.internal_log('yellow'),
        }
        self.internal_dir_store={}
        self.pending_assign_to={}
        self.pending_calls={}
        self.last_replies={}
        super().__init__()
        self.connect_to( self.builtin_call )
        self.maxid=1
        self.last_dir=[]
        self.client_core=CoreClient()
        self.commands={}
        self.commands_maxid=0

        self.client_core.connect_to( self.from_core )
        self.connect_to( self.client_core.send )


    def run_command(self, command, **kwargs):
        printc("Run external command %s"%command, color="blue", hl=True)
        client_command = CmdClient(command)

        self.connect_to( client_command.call_into_command )
        self.client_core.connect_to( client_command.call_into_command )

        client_command.connect_to( self.internal_commands )
        client_command.connect_to( self.client_core.send )
        self.commands[self.commands_maxid]=client_command
        self.commands_maxid+=1
        return self.commands_maxid


    def builtin_call(self, cmd, replyf):
        method = cmd.get("method")
        if method in self.builtin:
            result = self.builtin[method](*cmd["params"], _id=cmd.get('id'))
            self.debug("Builtin result: %s"%result)
            if result != PENDING:
                replyf({"id": cmd.get("id"), "result": result })
            return True
        # internals sends the data further
        if method in self.internal:
            ret = self.internal[method](*cmd["params"], id=cmd.get('id'))
            if ret and self.interactive:
                printc("[%s]*: %s"%(cmd.get('id'), json.dumps(ret)), color="purple", hl=True)
        return None

    def reply(self, reply):
        self.debug("CLI got reply!: %s"%reply)
        if 'result' in reply:
            result = reply["result"]
            id = reply.get('id')
            if id in self.pending_calls:
                del self.pending_calls[id]
            self.last_replies[id]=reply
            if self.interactive:
                printc("[%s]: %s"%(id, json.dumps(result, indent=2)), color="blue", hl=True)
            if result != self.vars:
                self.vars[""]=result
                varname = self.pending_assign_to.get(id)
                if varname:
                    self.debug("Fulfilled assign to %s -> %s"%(id, varname))

                    self.vars[varname] = result
                    if self.interactive:
                        printc("[%s]: %s"%(varname, json.dumps(result, indent=2)))
                    del self.pending_assign_to[id]
        elif 'error' in reply:
            id = reply.get('id')
            self.last_replies[id]=reply
            if id in self.pending_calls:
                del self.pending_calls[id]
                if self.interactive:
                    printc("[%s]: %s"%(id, json.dumps(reply["error"], indent=2)), color="red", hl=True)
        else:
            raise Exception("Got reply with no result nor error")
        return None

    def filenos(self):
        return (
            [self.client_core]
            +
            list(self.commands.values())
            )
    def fileno(self):
        raise NotImplementedError()
        return sys.stdin.fileno()

    def parse_line(self, line):
        """
        Parses a line and returns a simplified json rpc call dict.

        Examples:

        >>> res = parse_line("test command")
        >>> res == {"method":"test", "params":["command"]}
        True

        >>> res = parse_line("test 'long command' second 3")
        >>> res == {"method":"test", "params":["long command", "second", 3]}
        True

        >>> res = parse_line("test key:value key2=value")
        >>> res == {"method":"test", "params":{"key":"value", "key2":"value"}}
        True

        >>> res = parse_line("test key:value to_list null nil")
        >>> res == {"method":"test", "params":[{"key":"value"}, "to_list", None, None]}
        True

        >>> res = parse_line("test")
        >>> res == {"method":"test", "params":[]}
        True

        >>> res = parse_line("test \\"\\" ''")
        >>> res == {"method":"test", "params":["",""]}
        True

        >>> res = parse_line("__placeholder__ service:uuid:asdf,tags:[DOWN]")
        >>> res["params"]["service"]["uuid"]
        'asdf'
        >>> res["params"]["service"]["tags"]
        ['DOWN']

        >>> res = parse_line("__placeholder__ service:{uuid:asdf,tags:[DOWN]}")
        >>> res["params"]["service"]["uuid"]
        'asdf'
        >>> res["params"]["service"]["tags"]
        ['DOWN']

        """
        def parse_arg(a):
            assert a is not None
            if a=='nil' or a=='null':
                return None
            elif a.isdigit():
                return int(a)
            elif a.startswith('$'):
                return resolve_var(a[1:], self.vars)
            elif a and a[0] == "[" and a[-1]=="]":
                return [parse_arg(x) for x in a[1:-1].split(',')]
            elif a and a[0] == "{" and a[-1]=="}":
                return list_or_dict([parse_arg(x) for x in a[1:-1].split(',')])
            elif '=' in a:
                k,v = a.split('=',1)
                return {k.strip():v.strip()}
            elif '://' in a: # special case for protocols
                return a
            elif ':' in a:
                k,v = a.split(':',1)
                if ',' in v:
                    if v[0]=='{' and v[-1]=='}': # unnecesary, but may help readability
                        v=v[1:-1]
                    vv = list_or_dict( [parse_arg(x.strip()) for x in v.split(',')] )
                    return {k.strip():vv }

                return {k.strip():parse_arg(v.strip())}
            elif a == '{}':
                return {}
            # literal
            return a
        def list_or_dict(ld):
            if not ld:
                return []
            if all([type(x)==dict for x in ld]):
                r={}
                for d in ld:
                    r.update(d)
                return r
            return ld
        def resolve_var(expr, vars):
            if not type(vars) in (dict,list):
                return '%s.%s'%(str(vars), expr)
            if '.' in expr:
                (pre,post) = expr.split('.',1)
                if pre.isdigit():
                    pre=int(pre)
                return resolve_var(post, vars[pre])
            if expr.isdigit():
                expr=int(expr)
            return vars[expr]

        if line.startswith('#'):
            return None
        cmd = shlex.split( line )
        if not cmd:
            return None
        if len(cmd)>=3 and cmd[1]=='=':
            return {
                'method':parse_arg(cmd[2]),
                'params':list_or_dict( [parse_arg(x) for x in cmd[3:]] ),
                'assign_to' : cmd[0]
            }


        return {
            'method':parse_arg(cmd[0]),
            'params':list_or_dict( [parse_arg(x) for x in cmd[1:]] )
        }

    def internal_log(self, color, **kwargs):
        def real_log(msg, params={}, **kwargs):
            file=os.path.basename(params.get('file','--'))[-20:]
            line=params.get('line','--')
            for m in msg.split('\n'):
                printc("%.2fs [%20s:%s] %s"%(time_since_start(), file, line, m), color=color)
            return PASS
        return real_log

    def builtin_set(self, varname, expr=None, **kwargs):
        if expr is None:
            expr=self.vars['']
        self.vars[varname]=expr
        return expr

    def builtin_unset(self, varname, **kwargs):
        old = self.vars[varname]
        del self.vars[varname]
        return old

    def builtin_dir(self, _id=None, **kwargs):
        self.maxid+=1
        replyf = self.internal_dir_reply(len(self.connections)-1, _id)
        for c in self.connections[1:]:
            self.debug("Ask dir data to: %s"%(c.__name__))
            c( {"method":"dir", "id": self.maxid, "params": [] }, replyf )
            self.maxid+=1
        return PENDING
    def builtin_assert(self, a, b=None, **kwargs):
        if b:
            if a != b:
                raise Exception("Values are different")
        else:
            if not a:
                raise Exception("Not truish")
        return True
    def builtin_sleep(self, seconds, **kwargs):
        time.sleep(seconds)
        return seconds
    def builtin_pending(self, **kwargs):
        return self.pending_calls

    def internal_dir_reply(self, count, baseid):
        self.internal_dir_store[baseid] = list(self.builtin.keys()) + list(self.internal.keys())
        def reply(cmd):
            nonlocal count
            count-=1
            self.debug("More dir data:", cmd, count)
            if not baseid in self.internal_dir_store:
                return None
            self.internal_dir_store[baseid].extend(cmd["result"])
            if count==0:
                self.last_dir = self.internal_dir_store[baseid]
                if baseid!="autocomplete":
                    self.reply({"id": baseid, "result":self.last_dir})
                del self.internal_dir_store[baseid]
                return None
        return reply

    def parse_file(self, filename):
        ret=[]
        for lineno,l in enumerate(open(filename)):
            l = l.strip()
            try:
                printc("[%s:%s]: %s"%(filename, self.maxid, l), color="blue")
                self.call_line( l )
            except Exception:
                import traceback; traceback.print_exc()
                pass
        return ret

    def internal_commands(self, cmd, replyf):
        method = cmd.get("method")
        assert method

        m=self.internal.get(method)
        if m:
            params=cmd["params"]
            if type(params)==dict:
                res = m(**params)
            else:
                res = m(*params)
            if res == PASS:
                return None
            if cmd.get("id"):
                replyf({"id": cmd.get("id"), "result": res})
            return True

    def call_line(self, line):
        cmd = self.parse_line(line)
        if not cmd:
          return
        cmd['id'] = self.maxid
        self.maxid+=1

        if not cmd:
            return
        return self.call_cmd(cmd)

    def call(self, method, *args, _timeout=120, **kwargs):
        cmd = {
            "method": method,
            "params": kwargs or args,
            "id": self.maxid
        }
        cmd['id'] = self.maxid
        self.maxid+=1
        return self.call_cmd(cmd, _timeout=_timeout)

    def call_cmd(self, cmd, _timeout=120):
        id=cmd["id"]
        if 'assign_to' in cmd:
            self.debug("Pending assign to %s -> %s"%(id, cmd["assign_to"]))
            self.pending_assign_to[id]=cmd["assign_to"]
            del cmd["assign_to"]
        self.pending_calls[id]=cmd
        self.recv_and_parse_one(cmd)
        return self.wait_for_reply( id, _timeout )

    def from_core(self, res, replyf):
        if 'method' in res:
            printc('[event] {0}{1}'.format(res['method'],res['params']), color="blue", hl=True)
        else:
            printc("??? "+str(res), color="red")

    def wait_for_reply(self, id, _timeout=1000):
        timeleft=_timeout
        while not id in self.last_replies and timeleft>0:
            start_t=time.time()
            self.cli_loop_select(_timeout)
            timeleft-=(time.time() - start_t)
        if id in self.last_replies:
            res = self.last_replies[id]
            del self.last_replies[id]
            if 'error' in res:
                raise Exception(res["error"])
            else:
                return res["result"]
        else:
            raise Exception("timeout")

    def cli_loop_select(self, timeout):
        """

        Performs the select loop, where it waits for an answer inside the
        timeout from any source, and if any, parses it and then waits a little
        bit for more traffic, but not too much.

        This helps to wait for answers, do message passing and return fast to
        the next step.

        """
        parsed_some = True # requires thight loop, as it may be sending messages core<->cmd
        while parsed_some:
            parsed_some = False
            self.debug("Checking if data ready: %s // to %s"%(repr(self.filenos()), timeout) )
            for n, clients_ready in enumerate(select.select(self.filenos(),[],[], timeout)):
                # self.debug("Clients ready[%s]: "%n, clients_ready)
                for c in clients_ready:
                    # self.debug("Data ready at %s"%repr(c))
                    parsed_some |= c.recv_and_parse()
            # self.debug("parsed_more", parsed_some)
            timeout=0.1
        # self.debug("User input", parsed_some)

    def cli_loop(self, timeout=0.3):
        while True:
            #debugc("Wait max T %s"%timeout, color="purple")
            self.cli_loop_select(timeout)
            try:
                lid = self.maxid
                line = input('[%s]> '%(lid))
                if line:
                    self.call_line( line )
            except EOFError:
                debugc("EOF", color="green")
                return
            except:
                import traceback
                traceback.print_exc()
                debugc("Continuing", color="red", hl=True)

    def authenticate(self, auth_token = None):
        if not auth_token:
            auth_token = settings.get('token')
        if auth_token:
            if self.call("auth.auth", type="token", token=auth_token):
                printc("Authenticated via token", color="green")
                return True
            else:
                printc("Invalid (expired?) token. Authenticate again.", color="red")
        for i in range(3):
            email = input("Email: ")
            password = getpass.getpass("Password: ")
            if self.call("auth.auth", type="basic", email=email, password=password):
                settings["token"]=self.call("auth.token.create")
                with open(os.path.expanduser("~/.config/serverboards/s10s.json"), 'w') as wd:
                    json.dump(settings, wd)
                return True

            printc("Wrong credentials", color="red")
        os.exit(1)

class Completer:
    """
    Sets up the autocompleter to ease use of CLI

    >>> completer=Completer(Client())
    >>> completer.complete("", 0)
    'auth.auth'
    >>> completer.complete("", 1)
    'dir'
    >>> completer.complete("dir", 0)
    'dir '
    >>> completer.display_matches("", ["auth.auth", "dir"], 0) #doctest: +NORMALIZE_WHITESPACE
    auth.auth dir
    >
    """
    def __init__(self, client):
        self.client=client
        self.options=None

        histfile = os.path.join(os.path.expanduser("~/.local/serverboards/"), "cmd_history")
        try:
            os.makedirs(os.path.dirname(histfile))
        except FileExistsError:
            pass
            try:
                readline.read_history_file(histfile)
                readline.set_history_length(1000)
            except FileNotFoundError:
                pass
        atexit.register(readline.write_history_file, histfile)

        readline.set_completer(self.complete)
        readline.parse_and_bind("tab: complete")
        readline.set_completer_delims(" \t:\"'")
        #readline.set_completion_display_matches_hook(self.display_matches)

    def autocomplete(self, text):
        def vars(vs):
            if type(vs)==dict:
                for k,v in vs.items():
                    yield k
                    for s in vars(v):
                        yield '%s.%s'%(k,s)
            if type(vs)==list:
                for k,v in enumerate(vs):
                    yield '%d'%(k)
                    for s in vars(v):
                        yield '%d.%s'%(k,s)
            return
        try:
            self.client.builtin_dir("autocomplete")
            candidates = list(self.client.last_dir)
            candidates += list('$'+x for x in vars(self.client.vars))
        except:
            import traceback; traceback.print_exc()
            return []
        return candidates


    def complete(self, text, index):
        try:
            if index==0:
                self.options=sorted( self.autocomplete(text) )
                if text:
                    self.options=[x+' ' for x in self.options if x.startswith(text)]
            if index<len(self.options):
                return self.options[index]
            return None
        except:
            import traceback; traceback.print_exc()

    def display_matches(self, substitution, matches, longest_match_length):
        line_buffer = readline.get_line_buffer()
        print("")
        ll=0
        tabsize=[4,10,18,40,72]
        max_columns=80
        try:
            max_columns=os.get_terminal_size().columns
        except:
            pass
        try:
            padding=max( len(m) for m in matches )+2
            for match in matches:
                s=match+(' '*(padding-len(match)))
                ll+=len(s)
                if ll>max_columns:
                    print("")
                    ll=len(s)
                printc(s, color="yellow", end='')
        except:
            import traceback
            traceback.print_exc()

        print("\n> ", end="")
        print(line_buffer, end="")
        sys.stdout.flush()

settings = {}
try:
    settings.update( json.load(open(os.path.expanduser("~/.config/serverboards/s10s.json")) ) )
except:
    pass


def main():
    import argparse
    parser = argparse.ArgumentParser(description='Connect to Serverboards CORE or a command line plugin.')
    parser.add_argument('infiles', metavar='FILENAMES', type=str, nargs='*',
        help='file to be parsed')
    parser.add_argument('--command', type=str,
        help='Executes this command as a JSON-PC endpoint. To ease plugin debugging.')
    parser.add_argument('--one-line-help', action='store_true',
        help='Shows brief description.')
    parser.add_argument('--debug', action='store_true',
        help="Some extra debug output for the CLI")
    parser.add_argument('--no-auth', action='store_true',
        help="Do not authenticate automatically. By default tries to use stored auth token or asks for user/password")

    args = parser.parse_args()

    if args.one_line_help:
        print("Command Line Interpreter for commands and core connection")
        sys.exit(0)

    if args.debug:
        global DEBUG
        printc("Activating DEBUG.", color="yellow", hl=True)
        DEBUG=True

    # Connection to terminal CLI
    client_cli=CliClient()

    # Ensure authenticated. If do not want, use --no-auth
    if not args.no_auth:
        client_cli.authenticate()

    # Connection to command, if any
    if args.command:
        client_cli.run_command(args.command)

    interactive=True
    if args.infiles:
        interactive=False
        for f in args.infiles:
            if f == '-':
                interactive=True
            else:
                printc("Running %s"%(f), color="grey", hl=True)
                res = client_cli.parse_file(f)
                printc(json.dumps( res, indent=2), color="green")


    if interactive:
        print()
        print("s10s cli")
        print('Type "dir" for a list of current available commands')
        print("https://serverboards.io")

        completer=Completer(client_cli)
        try:
            client_cli.cli_loop()
        except KeyboardInterrupt:
            pass
    sys.exit(0)


if __name__=='__main__':  # pragma: no cover
    if len(sys.argv)>1 and sys.argv[1]=='--test':
        import doctest
        import serverboards

        res = doctest.testmod()
        #res = doctest.run_docstring_examples(parse_line, {"parse_line": parse_line})
        sys.exit(res)

    main()
