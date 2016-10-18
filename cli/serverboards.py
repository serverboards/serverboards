#!/usr/bin/python3

import readline, sys, shlex, json, select, os, atexit, time, math

def printc(s, color=None, hl=None, **kwargs):
    """
    Prints some text with some color, using Terminal escape sequences

    >>> printc("Hello world", color="blue")
    \033[1;34mHello world\033[1;m
    >>> printc("Hello world", color="blue", hl=True)
    \033[1;44mHello world\033[1;m

    """
    colors = {
    'red':31,
    'green':32,
    'blue':34,
    'grey':30,
    'yellow':33
    }
    code=colors.get(color)
    if code:
        if hl:
            code+=10
        print("\033[1;{0}m{1}\033[1;m".format(code, s), **kwargs)
    else:
        print(s, **kwargs)

def debugc(s, **kwargs):
    """
    Same as printc, but to stderr

    >>> sys.stderr=sys.stdout # to force on stdout
    >>> debugc("Test")
    Test

    """
    printc(s, file=sys.stderr, **kwargs)

def parse_command(line, vars={}):
    """
    Parses a line and returns a simplified json rpc call dict.

    Examples:

    >>> res = parse_command("test command")
    >>> res == {"method":"test", "params":["command"]}
    True

    >>> res = parse_command("test 'long command' second 3")
    >>> res == {"method":"test", "params":["long command", "second", 3]}
    True

    >>> res = parse_command("test key:value key2=value")
    >>> res == {"method":"test", "params":{"key":"value", "key2":"value"}}
    True

    >>> res = parse_command("test key:value to_list null nil")
    >>> res == {"method":"test", "params":[{"key":"value"}, "to_list", None, None]}
    True

    >>> res = parse_command("test")
    >>> res == {"method":"test", "params":[]}
    True

    >>> res = parse_command("test \\"\\" ''")
    >>> res == {"method":"test", "params":["",""]}
    True

    >>> res = parse_command("__placeholder__ service:uuid:asdf,tags:[DOWN]")
    >>> res["params"]["service"]["uuid"]
    'asdf'
    >>> res["params"]["service"]["tags"]
    ['DOWN']

    >>> res = parse_command("__placeholder__ service:{uuid:asdf,tags:[DOWN]}")
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
            return resolve_var(a[1:], vars)
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

class Client:
    """
    Client Connection.

    >>> client=Client()
    >>> client.call('version')['result']
    '0.0.1'
    >>> client.call('method.unknown params')['error']
    'unknown_method'
    >>> client.call('!version') # event call

    """
    def __init__(self, iostream):
        self.maxid=1
        self.iostream=iostream
        self.vars={}
        self.builtin={
            's': self.builtin_set,
            'set': self.builtin_set,
            'unset': self.builtin_unset,
            'vars': lambda :self.vars,
            'debug': self.set_debug,
            'print': lambda x: x,
            'p': lambda x: x,
            'import': self.parse_file,
        }
        self.internal={
            'log.error':self.internal_log('red'),
            'log.info':self.internal_log('white'),
            'log.debug':self.internal_log('blue'),
            'log.warning':self.internal_log('yellow'),
        }
        self.debug=False

    def close(self):
        self.iostream.close()

    def set_debug(self, _on=True):
        self.debug=_on
        return self.debug

    def internal_log(self, color):
        def real_log(msg, params):
            file=os.path.basename(params.get('file','--'))[-20:]
            line=params.get('line','--')
            for m in msg.split('\n'):
                printc("%20s:%d %s"%(file, line, m), color=color)
        return real_log

    def builtin_set(self, varname, expr=None):
        if expr is None:
            expr=self.vars['']
        self.vars[varname]=expr
        return expr

    def builtin_unset(self, varname):
        old = self.vars[varname]
        del self.vars[varname]
        return old

    @staticmethod
    def printc(*a, **b):
        """
        Allow to monkey patch printc for testing. Just calls printc.
        """
        printc(*a, **b)

    def send_command(self, cmd):
        if cmd['method'][0]!='!': # ! marks event
            cmd['id']=self.maxid
            self.maxid+=1
        else:
            cmd['method']=cmd['method'][1:]

        if self.debug:
            Client.printc(json.dumps(cmd), color="grey")

        self.iostream.send( bytearray(json.dumps(cmd)+'\n','utf8') )
        return cmd

    def wait_for_response(self, id=None, timeout=1.0):
        while select.select([self.iostream],[],[], timeout)[0]:
            response = self.get_response()
            if not response:
                return None
            elif id and not 'method' in response and response.get('id')==id:
                return response
            elif 'method' in response and 'id' in response: # this is a call
                user_response = input("%s%s> "%(response["method"], repr(response.get("params"))))
                result = parse_command("__placeholder__ %s"%(user_response), self.vars)["params"]
                if type(result) == list and len(result)==1:
                    result=result[0]
                cmd={"id": response["id"], "result": result }
                self.iostream.send( bytearray(json.dumps(cmd)+'\n','utf8') )
            elif 'method' in response and not 'id' in response and response['method'] in self.internal:
                try:
                    params=response['params']
                    method=response['method']
                    if type(params) == list:
                        self.internal[method](*params)
                    else:
                        self.internal[method](**params)
                except:
                    import traceback
                    traceback.print_exc()
            else:
                Client.printc(response, color="grey")

        return None

    def get_response(self):
        try:
            nl = self.iostream.recv(1024*1024).decode('utf8')
        except BlockingIOError:
            return None
        if len(nl)==0:
            Client.printc("Closed connection", color="grey")
            return None
        res = json.loads(nl)
        return res

    def call(self, line):
        """
        Performs the parsing, sending command, and receiving answer.

        May be a builtin command, as set.
        """
        if line.startswith('#'):
            return None
        cmd = parse_command(line, self.vars)
        if cmd['method'] in self.builtin:
            if self.debug:
                Client.printc(json.dumps(cmd), color="grey")
            params = cmd['params']
            if type(params) == list:
                res = {'id': cmd.get('id'), 'result': self.builtin[cmd['method']](*params)}
            else:
                res = {'id': cmd.get('id'), 'result': self.builtin[cmd['method']](**params)}
        else:
            req = self.send_command( cmd )
            res = self.wait_for_response(req.get('id'))
        # keep last result
        if res and res.get('result')!=self.vars:
            self.vars['']=res.get('result')
        return res

    def parse_file(self, filename):
        ret=[]
        for l in open(filename):
            try:
                ret.append( self.call(l) )
            except Exception:
                pass
        return ret

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
            candidates = list(self.call("dir")['result'])
            candidates += list(self.builtin.keys())
            candidates += list('$'+x for x in vars(self.vars))
        except:
            import traceback; traceback.print_exc()
            return []
        return candidates

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

        histfile = os.path.join(os.path.expanduser("~/.config/serverboards/"), "cmd_history")
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
        readline.set_completion_display_matches_hook(self.display_matches)


    def complete(self, text, index):
        if index==0:
            self.options=sorted( self.client.autocomplete(text) )
            if text:
                self.options=[x+' ' for x in self.options if x.startswith(text)]
        if index<len(self.options):
            return self.options[index]
        return None
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
                print(s, end='')
        except:
            import traceback
            traceback.print_exc()

        print("\n> ", end="")
        print(line_buffer, end="")
        sys.stdout.flush()

def cli_loop(client):
    while True:
        try:
            line = input('> ')
            if line:
                res = client.call( line )
                if not res:
                    pass
                elif 'result' in res:
                    Client.printc(json.dumps(res['result'], indent=2), color="blue")
                elif 'error' in res:
                    Client.printc('*** '+str(res['error']), color="red")
                elif 'method' in res:
                    Client.printc('<<< {0}({1})'.format(res['method'],res['params']), color="grey", hl=True)
                else:
                    Client.printc("??? "+str(res), color="red")
            else:
                client.wait_for_response(timeout=0.1)
        except EOFError:
            return
        except:
            import traceback
            traceback.print_exc()
            Client.printc("Continuing", color="red", hl=True)

class CmdStream:
    def __init__(self, command):
        import subprocess, fcntl
        self.process=subprocess.Popen(
            command,
            bufsize=1, # line buffered
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            )

    def recv(self, buffersize):
        return self.process.stdout.readline()

    def send(self, msg):
        ret=self.process.stdin.write(msg)
        self.process.stdin.flush()
        return ret

    def fileno(self):
        """
        File no to `select` on read.
        """
        return self.process.stdout.fileno()

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

if __name__=='__main__':  # pragma: no cover
    def main():
        import argparse
        parser = argparse.ArgumentParser(description='Connect to Serverboards CORE or a command line plugin.')
        parser.add_argument('infiles', metavar='FILENAMES', type=str, nargs='*',
            help='file to be parsed')
        parser.add_argument('--command', type=str,
            help='Executes this command as a JSON-PC endpoint. To ease plugin debugging.')

        args = parser.parse_args()

        client=None
        if args.command:
            print("Run external command %s"%args.command)
            cmdstream=CmdStream(args.command)
            client = Client(iostream=cmdstream)
        else:
            import socket
            s = socket.create_connection(("localhost", "4040"))
            s.setblocking(False)
            client = Client(iostream=s)

        client.wait_for_response()

        interactive=True
        if args.infiles:
            interactive=False
            for f in args.infiles:
                if f == '-':
                    interactive=True
                else:
                    printc("Running %s"%(f), "grey")
                    res = client.parse_file(f)
                    printc(json.dumps( res, indent=2), "blue")


        if interactive:
            completer=Completer(client)
            cli_loop(client)
        client.close()
        sys.exit(0)

    if len(sys.argv)>1 and sys.argv[1]=='--test':
        import doctest
        import serverboards
        Client.printc=lambda *a, **b: None

        res = doctest.testmod()
        #res = doctest.run_docstring_examples(parse_command, {"parse_command": parse_command})
        sys.exit(res)

    main()
