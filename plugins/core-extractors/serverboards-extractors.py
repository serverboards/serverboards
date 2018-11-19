#!/usr/bin/python3

import serverboards_aio as serverboards
import curio
import asks
import re
from serverboards import print
asks.init('curio')


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


fields_re = re.compile(r"\{\{(.*?)\}\}")


def get_fields(str):
    return fields_re.findall(str)


@serverboards.rpc_method
def http_schema(config, table):
    config = config.get("config")
    if not table:
        return [config["table"]]
    else:
        url = config.get("url", "")
        headers = config.get("headers", "")
        return {
            "columns": get_fields(url + headers) + ["url", "result", "status_code"]
        }


def get_row(result, fields, columns):
    r = []
    for c in columns:
        if c == "result":
            r.append(result)
        else:
            r.append(fields.get(c))
    return r


@serverboards.rpc_method
async def http_extractor(config, table, quals, columns):
    config = config.get("config")
    url = config.get("url", "")
    headers = config.get("headers", "")

    qs = http_extractor_get_qs(quals)
    # print("qs", qs, quals)

    rows = []
    for q in qs:
        rows += [
            get_row(row, q, columns)
            for row in (await http_extractor_with_fields(q, columns, url, headers))
        ]

    return {
        "columns": columns,
        "rows": rows,
    }


def http_extractor_get_qs(quals):
    if not quals:
        return [{}]
    restfields = http_extractor_get_qs(quals[1:])

    k, op, v = quals[0]
    # print("Mix", k, op, v, restfields)
    ret = []
    if op == 'IN':
        vs = v
        ret = []
        for v in vs:
            for r in restfields:
                ret.append({
                    **r,
                    k: v,
                })
    elif op == '=':
        for r in restfields:
            ret.append({
                **r,
                k: v,
            })
    else:
        raise Exception("Invalid operator for %s %s" % (k, op))

    return ret


async def http_extractor_with_fields(fields, columns, url, headers):
    url = fields_re.sub((lambda k: fields.get(k.group(1))), url)
    headers = fields_re.sub((lambda k: fields.get(k.group(1))), headers)
    # print(repr(headers))

    def split_header_line(str):
        k, v = str.split(':')
        return [k.strip(), v.strip()]

    headers = dict([
        split_header_line(line)
        for line in headers.split('\n')
        if line
    ])
    headers["User-Agent"] = "Serverboards - https://serverboards.io"
    # print("GET %s: %s", url, headers)

    res = await asks.get(url, headers=headers)
    fields["status_code"] = res.status_code
    fields["url"] = url
    try:
        result = res.json()
        if isinstance(result, dict):
            return [result]
        elif isinstance(result, list):
            return result
    except Exception as e:
        return [{"error": str(e)}]


if __name__ == '__main__':
    serverboards.loop()
