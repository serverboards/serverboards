#!/usr/bin/python3

import sys
import os
import yaml
import json

__doc__ = """s10s plugin -- Plugin management
Allows to install, uninstall and update plugins.

It uses git URLS to manage the state.

Plugin management:
    s10s plugin list [what]   -- Lists all the plugins
    s10s plugin install <url> -- Installs a plugin by URL
    s10s plugin remove <path|plugin_id>  -- Removes a plugin
    s10s plugin update <path|plugin_id>  -- Updates a plugin
"""

paths = [
    "/home/dmoreno/.local/serverboards/plugins/",
    "/home/dmoreno/src/serverboards/plugins/"
]

format = "text"


def output_data(data):
    if not data:
        return
    if format == "json":
        print(json.dumps(data))
        return

    def pad(st, pad, padchar=" "):
        s = str(st)
        while len(s) < pad:
            s += padchar
        return s

    keys = list(data[0].keys())
    w = {k: len(k) for k in keys}
    for d in data:
        for k in keys:
            dlen = len(str(d[k]))
            if dlen > w[k]:
                w[k] = dlen

    print("\n| ", end="")
    for k in keys:
        print(" %s |" % pad(k, w[k]), end="")
    print("\n+-", end="")
    for n, k in enumerate(keys):
        print("%s+" % pad("", w[k] + 2, "-"), end="")
    for d in data:
        print("\n| ", end="")
        for k in keys:
            print(" %s |" % pad(d[k], w[k]), end="")
    print()


def all_plugins():
    for p in paths:
        for ppath in os.listdir(p):
            path = os.path.join(p, ppath)
            manifest = os.path.join(path, "manifest.yaml")
            extra = os.path.join(path, ".extra.yaml")
            if os.path.exists(manifest):
                try:
                    with open(manifest) as fd:
                        data = yaml.load(fd)
                        data["status"] = "ok"
                except yaml.scanner.ScannerError as e:
                    data = {
                        "id": manifest,
                        "status": "manifest-broken",
                        "message": str(e)
                    }
                if os.path.exists(extra):
                    with open(extra) as fd:
                        data.update(yaml.load(fd))
                data["path"] = path
                yield data


def list_(what=[]):
    if not what:
        what = ["id", "status", "version"]
    res = []
    for pl in all_plugins():
        res.append({k: pl.get(k) for k in what})
    output_data(res)


def main(argv):
    for n, a in enumerate(argv):
        if a.startswith("--format="):
            global format
            format = a[9:]
            argv = argv[:n] + argv[n + 1:]

    if not argv:
        print(__doc__)
        sys.exit(0)
    if argv[0] == '--one-line-help':
        print("Plugin management")
    if argv[0] == '--help' or argv[0] == 'help':
        print(__doc__)
        sys.exit(0)
    if argv[0] == 'list':
        list_(argv[1:])


if __name__ == "__main__":
    main(sys.argv[1:])
