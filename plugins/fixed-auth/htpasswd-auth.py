#!/bin/python
import serverboards

@serverboards.rpc_method
def auth(email, password):
    if email=="dmoreno@serverboards.io" and password=="asdfghjkl":
        return 'dmoreno@serverboards.io'
    return False


serverboards.loop()
