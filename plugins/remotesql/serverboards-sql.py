#!/usr/bin/python
import sys, os, datetime
import serverboards
from serverboards import rpc
import psycopg2

class Connection:
    conn = False
    port = None
    ssh_plugin_id = None

conn=Connection()

@serverboards.rpc_method
def open(via=None, type="postgresql", hostname="localhost", port="5432", username=None, password_pw=None, database="template1"):
    if conn.conn:
        conn.conn.close()
        if conn.ssh_plugin_id:
            rpc.call("%s.close_port"%conn.ssh_plugin_id, port=conn.port)
        conn.conn=None
        conn.port=None


    if type!="postgresql":
        raise Exception("Database type not supported")

    if via and hostname!=localhost:
        conn.ssh_plugin_id = rpc.call("plugin.start", "serverboards.core.ssh/daemon")
        conn.port = rpc.call("%s.open_port"%conn.ssh_plugin_id, url=via, hostname=hostname, port=port)
        hostname="localhost"
        port=conn.port
    conn.conn = psycopg2.connect(database=database, user=username, password=password_pw, host=hostname, port=port)
    return True

@serverboards.rpc_method
def close():
    conn.conn.close()
    if conn.ssh_plugin_id:
        rpc.call("%s.close_port"%conn.ssh_plugin_id, port=conn.port)
    sys.exit(0)

@serverboards.rpc_method
def databases():
    return [
        x[0] for x in
        execute("SELECT datname FROM pg_database WHERE datistemplate = false;")['data']
        ]

@serverboards.rpc_method
def tables():
    return [
        x[0] for x in
        execute("SELECT relname FROM pg_class WHERE relkind='r' AND relname !~ '^(pg_|sql_)';")['data']
        ]

def serialize(x):
    if type(x) == datetime.datetime:
        return x.isoformat()
    return x

@serverboards.rpc_method
def execute(query):
    with conn.conn.cursor() as cur:
        cur.execute(query)
        return {
            "columns": [x[0] for x in cur.description],
            "data": [[serialize(y) for y in x] for x in cur.fetchall()]
        }

serverboards.loop()
