#!/usr/bin/python
import serverboards, time

@serverboards.rpc_method
def simple_trigger(id):
    serverboards.rpc.reply(id)
    while True:
        serverboards.rpc.event("trigger", state="tick", id=id)
        time.sleep(0.2)

serverboards.loop() # debug=sys.stderr)
