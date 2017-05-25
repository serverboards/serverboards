#!/usr/bin/python3

import readline, sys, shlex, json, select, os, atexit, time, math, socket
from io import StringIO
DEBUG=False
PENDING="66509317-642c-4670-a2ef-78155e32c4a9" # to be unique, not confuse with any response
PASS="c0deb94a-4cc1-40a1-bffb-e935b0747ae3"

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
        print(s, **kwargs)

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
    >>> client.call('version')['result']
    '0.0.1'
    >>> client.call('method.unknown params')['error']
    'unknown_method'
    >>> client.call('!version') # event call

    """
    def __init__(self):
        self.maxid=1
        self._debug=DEBUG
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
        self._debug=_on
        self.debug("Setting debug ON!")
        return self._debug

    def debug(self, *txt, **kwargs):
        if self._debug:
            extra_args={"color": "purple", "hl":False}
            extra_args.update(kwargs)
            printc("%s:"%(self.__class__.__name__), *txt, **extra_args)

    def recv_and_parse(self):
        for cmd in self.readcmds():
            self.recv_and_parse_one(cmd)
        return False

    def reply(self, reply):
        raise NotImplementedError()

    def recv_and_parse_one(self, cmd):
        for fn in self.connections:
            # self.debug("Try call into %s"%(fn.__name__),cmd, hl=True)
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
            if 'result' in cmd or 'error' in cmd:
                id = cmd.get('id')
                self.pending_replies[id](cmd)
                del self.pending_replies[id]
            else:
                if 'id' in cmd:
                    self.pending_requests[cmd['id']]=cmd
                yield cmd

    def readcmds_unfiltered(self):
        data = self.socket.recv(1024).decode('utf8')
        self.debug("read>>> %s"%(data))
        if '\n' in data:
            datal=data.split("\n")
            line = (self.buffer.getvalue()+datal[0]).strip()
            yield json.loads(line)
            for l in datal[1:-1]:
                line = l.strip()
                yield json.loads(line)
            self.buffer=StringIO(data[-1])
        else:
            self.buffer.write(data)

    def send(self, cmd, replyf):
        method = cmd.get('method')
        assert method

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
        import subprocess, fcntl
        self.process=subprocess.Popen(
            command,
            bufsize=1, # line buffered
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            )
        self.pending_cmds={}

        super().__init__()

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

        if cmd.get('id'):
            self.pending_cmds[cmd.get('id')]=replyf

        self.process.stdin.write( (json.dumps(cmd) + "\n").encode('utf8') )
        self.process.stdin.flush()
        return True

    def reply(self, reply):
        if reply.get('id') != None:
            self.debug("reply to command> %s"%(reply))
            self.process.stdin.write( (json.dumps(reply) + "\n").encode('utf8') )

    def readcmds(self):
        for cmd in self.readcmds_unfiltered():
            id = cmd.get('id')
            if id in self.pending_cmds:
                self.pending_cmds[id](cmd)
            else:
                yield cmd

    def readcmds_unfiltered(self):
        data = self.process.stdout.readline().decode('utf8')
        return [json.loads(data)]

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
    def __init__(self, stdin=sys.stdin, stdout=sys.stdout):
        self.stdin=stdin
        self.stdout=stdout
        self.vars={}
        self.builtin={
            's': self.builtin_set,
            'set': self.builtin_set,
            'unset': self.builtin_unset,
            'vars': lambda _id:self.vars,
            'debug': self.set_debug,
            'print': lambda x, _id: x,
            'p': lambda x, _id: x,
            'import': lambda filename, _id: self.parse_file(filename),
            'dir':self.builtin_dir
        }
        self.internal={
            'log.error':self.internal_log('red'),
            'log.info':self.internal_log('white'),
            'log.debug':self.internal_log('blue'),
            'log.warning':self.internal_log('yellow'),
        }
        self.internal_dir_store={}
        self.pending_replies={}
        super().__init__()
        self.connect_to( self.builtin_call )
        self.maxid=1
        self.last_dir=[]

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
            if ret:
                printc("[%s]*: %s"%(cmd.get('id'), json.dumps(ret)), color="purple", hl=True)
        return None

    def reply(self, reply):
        if 'result' in reply:
            result = reply["result"]
            if result != self.vars:
                self.vars[""]=result
            printc("[%s]: %s"%(reply.get('id'), json.dumps(result, indent=2)), color="blue", hl=True)
        else:
            printc("[%s]: %s"%(reply.get('id'), json.dumps(reply["error"], indent=2)), color="red", hl=True)

    def fileno(self):
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


        cmd = shlex.split( line )
        return {
            'method':parse_arg(cmd[0]),
            'params':list_or_dict( [parse_arg(x) for x in cmd[1:]] )
        }

    def internal_log(self, color, **kwargs):
        def real_log(msg, params={}):
            file=os.path.basename(params.get('file','--'))[-20:]
            line=params.get('line','--')
            for m in msg.split('\n'):
                printc("%20s:%s %s"%(file, line, m), color=color)
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
            c( {"method":"dir", "id": self.maxid, "params": [] }, replyf )
            self.maxid+=1
        return PENDING

    def internal_dir_reply(self, count, baseid):
        self.internal_dir_store[baseid] = list(self.builtin.keys()) + list(self.internal.keys())
        def reply(cmd):
            nonlocal count
            count-=1
            self.debug("More dir data:", cmd["result"], count)
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

        return list() + list(self.internal.keys())


    def readcmds(self):
        line = self.stdin.readline().strip()
        if not line:
            debugc("Empty line at %s"%(repr(self)), color="red")
            return []
        try:
            return [self.parse_line(line)]
        except:
            debugc("Invalid JSON data: %s"%repr(line), color="red")
            return []

    def parse_file(self, filename):
        ret=[]
        for l in open(filename):
            try:
                self.parse_line( l )
            except Exception:
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

    def call(self, line):
        cmd = self.parse_line(line)
        cmd['id'] = self.maxid
        self.maxid+=1
        self.recv_and_parse_one(cmd)

    def from_core(self, res, replyf):
        if 'method' in res:
            printc('[event] {0}{1}'.format(res['method'],res['params']), color="blue", hl=True)
        else:
            printc("??? "+str(res), color="red")

    def close(self):
        pass

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

def cli_loop(client_cli, *more_clients, timeout=0.3):
    clients=[client_cli] + list(more_clients)
    while True:
        more_data=True
        while more_data:
            more_data=False
            for client_ready in select.select([x for x in more_clients if x],[],[], timeout):
                for c in client_ready:
                    c.recv_and_parse()
                    more_data=True

        try:
            lid = client_cli.maxid
            line = input('[%s]> '%(lid))
            if line:
                client_cli.call( line )
        except EOFError:
            debugc("EOF", color="green")
            return
        except:
            import traceback
            traceback.print_exc()
            debugc("Continuing", color="red", hl=True)


def main():
    print()
    print("s10s cli")
    print('Type "dir" for a list of current available commands')
    print("https://serverboards.io")
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

    args = parser.parse_args()

    if args.one_line_help:
        print("Command Line Interpreter for commands and core connection")
        sys.exit(0)

    if args.debug:
        global DEBUG
        printc("Activating DEBUG.", color="yellow", hl=True)
        DEBUG=True

    # Connection to Serverboards CORE
    client_core = CoreClient()

    # Connection to terminal CLI
    client_cli=CliClient()

    # Connection to command, if any
    client_command=None
    if args.command:
        printc("Run external command %s"%args.command, color="blue", hl=True)
        client_command = CmdClient(args.command)


    ## Connections, order is important, as consumers decide if stop the chain
    if client_command:
        client_cli.connect_to( client_command.call_into_command )
        client_core.connect_to( client_command.call_into_command )

        client_command.connect_to( client_cli.internal_commands )
        client_command.connect_to( client_core.send )


    client_core.connect_to( client_cli.from_core )

    client_cli.connect_to( client_core.send )

    interactive=True
    if args.infiles:
        interactive=False
        for f in args.infiles:
            if f == '-':
                interactive=True
            else:
                printc("Running %s"%(f), "grey")
                res = client_cli.parse_file(f)
                printc(json.dumps( res, indent=2), "green")


    if interactive:
        completer=Completer(client_cli)
        cli_loop(client_cli, client_core, client_command)
    client_cli.close()
    sys.exit(0)


if __name__=='__main__':  # pragma: no cover
    if len(sys.argv)>1 and sys.argv[1]=='--test':
        import doctest
        import serverboards

        res = doctest.testmod()
        #res = doctest.run_docstring_examples(parse_line, {"parse_line": parse_line})
        sys.exit(res)

    main()
