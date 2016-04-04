#!/usr/bin/python3

import readline, sys, shlex, json, select, os, atexit

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

def parse_command(line):
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

    """
    def parse_arg(a):
        assert a
        if a=='nil' or a=='null':
            return None
        elif a.isdigit():
            return int(a)
        elif ':' in a:
            k,v = a.split(':')
            return {k.strip():v.strip()}
        elif '=' in a:
            k,v = a.split('=')
            return {k.strip():v.strip()}
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

    cmd = shlex.split( line )
    return {
        'method':cmd[0],
        'params':list_or_dict( [parse_arg(x) for x in cmd[1:]] )
    }

class Client:
    """
    Client Connection.

    >>> client=Client(stdout=False)
    >>> client.call('version')
    '0.0.1'
    >>> client.call('method.unknown params')
    Traceback (most recent call last):
        ...
    Exception: unknown_method
    >>> client.call('!version') # event call

    """
    def __init__(self, stdout=True):
        self.stdout=stdout
        self.maxid=0
        self.connect()

    def connect(self, server="localhost", port="4040"):
        import socket
        self.socket = socket.create_connection((server, port))
        self.socket.setblocking(False)

    def send_command(self, cmd):
        if cmd['method'][0]!='!': # ! marks event
            cmd['id']=self.maxid
            self.maxid+=1
        else:
            cmd['method']=cmd['method'][1:]

        if self.stdout:
            debugc(">>> "+json.dumps(cmd), color="grey")
        self.socket.send( bytearray(json.dumps(cmd)+'\n','utf8') )
        return cmd

    def wait_for_response(self, id=None, timeout=1.0):
        while select.select([self.socket],[],[], timeout):
            response = self.get_response()
            if not response:
                return None
            elif response.get('id')==id:
                return response
        return None

    def get_response(self):
        try:
            nl = self.socket.recv(1024).decode('utf8')
        except BlockingIOError:
            return None
        res = json.loads(nl)
        if self.stdout:
            if 'result' in res:
                printc(res['result'], color="blue")
            if 'error' in res:
                printc('*** '+res['error'], color="red")
            if 'method' in res:
                printc('<<< {0}({1})'.format(res['method'],res['params']), color="grey", hl=True)
        return res

    def call(self, line):
        """
        Performs the parsing, sending command, and receiving answer
        """
        if line.startswith('#'):
            return None
        cmd = self.send_command( parse_command(line) )
        res = self.wait_for_response(cmd.get('id'))
        if res:
            if 'result' in res:
                return res['result']
            else:
                raise Exception(res['error'])
        return None

    def parse_file(self, filename):
        for l in open(filename):
            try:
                self.call(l)
            except Exception:
                pass

if __name__=='__main__':  # pragma: no cover
    histfile = os.path.join(os.path.expanduser("~/.config/serverboards/"), "cmd_history")
    try:
        os.makedirs(os.path.dirname(histfile))
    except FileExistsError:
        pass

    try:
        readline.read_history_file(histfile)
        # default history len is -1 (infinite), which may grow unruly
        readline.set_history_length(1000)
    except FileNotFoundError:
        pass
    atexit.register(readline.write_history_file, histfile)

    def main():
        client = Client()
        client.wait_for_response()

        if len(sys.argv)>1:
            for in_file in sys.argv[1:]:
                client.parse_file(in_file)
        else:
            try:
                while True:
                    line = input('> ')
                    try:
                        client.call( line )
                    except:
                        pass
            except EOFError:
                pass

    if len(sys.argv)>1 and sys.argv[1]=='--test':
            import doctest
            res = doctest.testmod()
            os.exit(res)

    main()
