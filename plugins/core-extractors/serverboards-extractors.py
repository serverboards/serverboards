#!/usr/bin/python3

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../bindings/python/'))
import serverboards
from serverboards import print


@serverboards.rpc_method
def serverboards_extractor(config, table, quals, columns):
    if table == "service":
        return service_extractor(quals, columns)
    if table == "user":
        return user_extractor(quals, columns)
    if table == "rules":
        return rules_extractor(quals, columns)
    return {
        "columns": columns,
        "rows": []
    }


def service_extractor(quals, columns):
    services = serverboards.service.list()

    rows = []
    for s in services:
        rows.append([
            s["uuid"],
            s["name"],
            s["description"],
            s["tags"],
            s["type"]
        ])

    return {
        "columns": ["uuid", "name", "description", "tags", "type"],
        "rows": rows
    }


def user_extractor(quals, columns):
    users = serverboards.user.list()

    rows = []
    for s in users:
        rows.append([
            s["name"],
            s["email"],
            s["is_active"]
        ])

    return {
        "columns": ["name", "email", "is_active"],
        "rows": rows
    }


def rules_extractor(quals, columns):
    rules = serverboards.rules_v2.list()

    rows = []
    for r in rules:
        rows.append([
            r["uuid"],
            r["name"],
            r["description"],
            r["project"],
            r["is_active"]
        ])

    return {
        "columns": ["uuid", "name", "description", "project", "is_active"],
        "rows": rows
    }


@serverboards.rpc_method
def serverboards_schema(config, table=None):
    if not table:
        return ["service", "user", "rules"]
    if table == "user":
        return {
            "description": "User database on Serverboards",
            "columns": [
                "name", "email",
                {
                    "name": "is_active",
                    "type": "bool",
                    "description": "User is active at Serverboards"
                }
            ]
        }
    if table == "service":
        return {
            "columns": ["uuid", "name", "description", "tags", "type"]
        }
    if table == "rules":
        return {
            "columns": ["uuid", "name", "description", "project", "is_active"]
        }
    raise Exception("unknown-table")


# TABLE EXTRACTOR

def table_parse_config(config):
    ret = {}
    current_table = None
    rows = []
    read_headers = False
    for l in config.get("config", {}).get("data", "").split('\n'):
        if not l:
            continue
        elif l[0] == '#':
            rows = []
            current_table = l[1:].strip()
            read_headers = True
        elif read_headers:  # next loop round
            read_headers = False
            columns = l.split(',')
            ret[current_table] = {"columns": columns, "rows": rows}
        else:
            rows.append(l.split(','))
    return ret


@serverboards.rpc_method
def table_schema(config, table):
    tables = table_parse_config(config)
    if not table:
        return list(tables.keys())
    if table in tables:
        return {"columns": tables[table]["columns"]}
    raise Exception('unknown-table')


@serverboards.rpc_method
def table_extractor(config, table, _quals, _columns):
    tables = table_parse_config(config)
    if table in tables:
        return tables[table]
    raise Exception('unknown-table')


if __name__ == '__main__':
    serverboards.loop()
