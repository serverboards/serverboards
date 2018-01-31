#!/usr/bin/python3
import sys
import os
import io
import csv
sys.path.append(os.path.join(os.path.dirname(__file__), '../bindings/python/'))
import serverboards
from serverboards import print, Plugin

ssh = Plugin("serverboards.core.ssh/daemon")


@serverboards.rpc_method
def csv_schema(config, table=None):
    print(config, table)
    if not table:
        res = ssh.run(
            service=config["service"],
            command=["ls", "-1", config["config"]["path"]]
        )
        if res["success"]:
            tables = [
                x[:-4]
                for x in res["stdout"].split('\n')
                if x.endswith(".csv")
            ]
            print("Got tables", tables)
            return tables
    elif '.' not in table and '/' not in table:
        res = ssh.run(
            service=config["service"],
            command=[
                "head",
                "-1",
                os.path.join(config["config"]["path"], table + ".csv")
            ]
        )
        if res["success"]:
            headers = res["stdout"].strip().split(',')
            print("Table", table, headers)
            return headers
    return []


@serverboards.rpc_method
def csv_extractor(config, table, quals, columns):
    print("Get data", config, table, quals, columns)
    if '.' in table or '/' in table:
        raise Exception("invalid-table")
    res = ssh.run(
        service=config["service"],
        command=[
            "cat",
            os.path.join(config["config"]["path"], table + ".csv")
        ]
    )
    if not res["success"]:
        raise Exception("error-extrating-data")
    csvf = io.StringIO(res["stdout"])
    reader = csv.reader(csvf)
    columns = next(reader)
    rows = []
    for row in reader:
        rows.append(row)
    return {"columns": columns, "rows": rows}


if __name__ == '__main__':
    serverboards.loop()
