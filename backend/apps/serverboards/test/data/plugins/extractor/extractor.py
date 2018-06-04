#!/usr/bin/python3

import sys
import os
import random
sys.path.append(os.path.join(os.path.dirname(__file__),
    '../../../../../../../plugins/bindings/python/'))
import serverboards_aio as serverboards
from serverboards_aio import print


@serverboards.rpc_method
def schema(config, table=None):
    print("Get table ", config, table)
    if not table:
        return ["random"]

    if table == "random":
        return {
            "columns": [
                {"name": "random", "description": "The random number"},
                {"name": "min", "description": "The minimum value"},
                {"name": "max", "description": "The maximum value"}
            ],
            "description": "A table with a single random number. Can be \
                            tweaked to be between a max a min."
        }
    raise Exception("unknown-table")


@serverboards.rpc_method
def extractor(config, table, quals, columns):
    print("Extractor", config, table, quals, columns)
    if table == "random":
        return extractor_random(quals, columns)
    raise Exception("unknown-table")


def extractor_random(quals, columns):
    min = get_qual(quals, "min", "=", 0)
    max = get_qual(quals, "max", "=", 1)

    return {
        "columns": ["random", "min", "max"],
        "rows": [[min + random.random() * (max - min), min, max]]
    }


def get_qual(quals, col, op, default):
    for q in quals:
        if q[0] == col and q[1] == op:
            return q[2]
    return default

if __name__ == '__main__':
    # serverboards.set_debug()
    print("Starting", file=sys.stderr)
    serverboards.loop()
