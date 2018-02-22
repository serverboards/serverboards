#!/usr/bin/python3

import sys
import os
import random
sys.path.append(os.path.join(os.path.dirname(__file__),
    '../../../../../../../plugins/bindings/python/'))
import serverboards_aio as serverboards
from serverboards import print


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
    return {
        "columns": ["random", "min", "max"],
        "rows": [[random.random(), 0, 1]]
    }


if __name__ == '__main__':
    # serverboards.set_debug()
    serverboards.loop()
