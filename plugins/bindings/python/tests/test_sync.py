#!/usr/bin/python3

import os
import json
import sh
import sys


class MockRPC:
    def __init__(self, cmd):
        self.stdin_r, self.stdin_w = self.pipe()
        self.stdout_r, self.stdout_w = self.pipe()
        self.__methods = {}
        cmdc = sh.Command(cmd)
        self.process = cmdc(
            _bg=True,
            _out=self.stdout_w,
            _in=self.stdin_r,
            _err=sys.stderr)
        self.id = 1

    def call(self, method, *args, **kwargs):
        id = self.id
        self.id += 1
        rpc = json.dumps({
            "id": id,
            "method": method,
            "params": args or kwargs
        })
        self.stdin_w.write((rpc + '\n').encode('utf8'))
        self.stdin_w.flush()
        print("MOCK>> ", rpc)
        return self.wait_for(id)

    def wait_for(self, id):
        while True:
            line = self.stdout_r.readline()
            print("MOCK<<", line)
            rpc = json.loads(line)

            if rpc.get("result"):
                if rpc.get("id") == id:
                    return rpc.get("result")
                raise Exception("Bad order on results, this is just mock")

            if rpc.get("error"):
                if rpc.get("id") == id:
                    raise Exception(rpc.get("error"))
                raise Exception("Bad order on results, this is just mock")

            if rpc.get("method"):
                method = rpc.get("method")
                if method not in self.__methods:
                    res = {"id": rpc.get("id"), "error": "unknown_method"}
                else:
                    params = rpc.get("params")
                    if isinstance(params, list):
                        args = params
                        kwargs = {}
                    else:
                        args = []
                        kwargs = params
                    try:
                        res = {
                            "id": rpc.get("id"),
                            "result": self.__methods[method](*args, **kwargs)
                        }
                    except Exception as e:
                        res = {
                            "id": rpc.get("id"),
                            "error": str(e)
                        }
                print("MOCK>> ", res)
                self.stdin_w.write((json.dumps(res) + "\n").encode('utf8'))
                self.stdin_w.flush()

    def register(self, method, callback):
        self.__methods[method] = callback

    def pipe(self):
        r, w = os.pipe()
        fr = os.fdopen(r, "rb")
        fw = os.fdopen(w, "wb")
        return fr, fw


mock = MockRPC("./test_sync_rpc.py")


def test2():
    print("In test2")
    return mock.call("test3")
mock.register("test2", test2)

def do_test():
    res = mock.call("test1")
    assert res == "kool"


if __name__ == '__main__':
    do_test()
