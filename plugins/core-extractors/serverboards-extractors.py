#!/usr/bin/python3

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../bindings/python/'))
import serverboards


@serverboards.rpc_method
def serverboards_extractor(config, table, quals, columns):
    if table == "service":
        return service_extractor(quals, columns)
    if table == "user":
        return user_extractor(quals, columns)
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


@serverboards.rpc_method
def serverboards_schema(config, table=None):
    if not table:
        return ["service", "user"]
    if table == "user":
        return {
            "columns": [
                "name", "email",
                {"name": "is_active", "type": "bool"}
            ]
        }
    if table == "service":
        return {
            "columns": ["uuid", "name", "description", "tags", "type"]
        }
    raise Exception("unknown-table")


if __name__ == '__main__':
    serverboards.loop()
