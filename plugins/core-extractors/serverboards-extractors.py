#!/usr/bin/python3

import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__),'../bindings/python/'))
import serverboards


@serverboards.rpc_method
def serverboards_extractor(config, table, quals, columns):
    return {
        "columns": columns,
        "rows": []
    }

@serverboards.rpc_method
def serverboards_schema(config, table=None):
    if not table:
        return ["service", "user"]
    if table == "user":
        return {
            "columns": ["name", "email", {"name", "is_active", "type": "bool"}],
        }
    if table == "service":
        return {
            "columns": ["uuid", "name", "description", "tags"]
        }
    raise Exception("unknown-table")

if __name__=='__main__':
    serverboards.loop()
