#!/usr/bin/python3

import sys
import os
import yaml
import json
import subprocess
import re
import shlex
import shutil

__doc__ = """s10s plugin -- Plugin management
Allows to install, uninstall and update plugins.

It uses git URLS to manage the state.

Plugin management:
    s10s plugin list [what]   -- Lists all the plugins
    s10s plugin check         -- Checks if there is something to update
    s10s plugin install <url> -- Installs a plugin by URL
    s10s plugin remove <path|plugin_id>  -- Removes a plugin
    s10s plugin update <path|plugin_id>  -- Updates a plugin
"""

paths = [
    "/home/dmoreno/.local/serverboards/plugins/",
    "/home/dmoreno/src/serverboards/plugins/"
]
install_path = "/home/dmoreno/.local/serverboards/plugins/"

format = "text"


def output_data(data):
    if format == "json":
        print(json.dumps(data))
        return

    if not data:
        return

    def colorize(txt):
        txt = str(txt)
        color = None
        if txt.startswith("None"):
            color = 30
        if txt.startswith("False"):
            color = 31
        if txt.startswith("True"):
            color = 32
        if color:
            return "\033[0;%dm%s\033[1;m" % (color, txt)
        return txt

    def pad(st, pad, padchar=" "):
        s = str(st)
        while len(s) < pad:
            s += padchar
        return s

    keys = list(data[0].keys())
    w = {k: len(k) for k in keys}
    for d in data:
        for k in keys:
            dlen = len(str(d[k]).split('\n')[0])
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
            v = str(d[k]).split('\n')[0]
            print(" %s |" % colorize(pad(v, w[k])), end="")
    print()


all_plugins_cache = None


def all_plugins():
    global all_plugins_cache
    if all_plugins_cache:
        return all_plugins_cache
    all_plugins_cache = []
    for p in paths:
        for ppath in os.listdir(p):
            path = os.path.join(p, ppath)
            data = read_plugin(path)
            if data:
                all_plugins_cache.append(data)
    return all_plugins_cache


def read_plugin(path):
    manifest = os.path.join(path, "manifest.yaml")
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
        extra = os.path.join(path, ".extra.yaml")
        if os.path.exists(extra):
            with open(extra) as fd:
                data.update(yaml.load(fd))

        # TODO: Will work on other sources later
        gitdir = os.path.join(path, ".git")
        if os.path.exists(gitdir):
            data["source"] = "git"

        data["path"] = path
        return data


def clean_plugin_cache():
    global all_plugins_cache
    all_plugins_cache = None


def get_plugin(id):
    if id.startswith("/"):
        return read_plugin(id)
    for pl in all_plugins():
        if pl.get("id") == id or pl.get("path") == id:
            return pl
    return {}


def check_updates(ids):
    """
    Checks every installed plugin for new upgrades.
    """
    ids = set(ids)
    ret = []
    for pl in all_plugins():
        if not ids or pl.get("id") in ids or pl.get("path") in ids:
            res = check_update(pl)
            if res:
                ret.append(res)
    output_data(ret)


AHEAD_RE = re.compile(b".*\[behind (\d*)\].*")


def check_update(pl):
    if pl.get("source") != "git":
        return

    os.chdir(pl["path"])
    os.system("git fetch --quiet")
    output = subprocess.run(
        ["git", "status", "--porcelain", "--branch"],
        stdout=subprocess.PIPE
    )
    m = AHEAD_RE.match(output.stdout)
    up_to_date = True
    if m:
        up_to_date = "Behind %s" % m.groups(1)[0].decode('utf8')

    if up_to_date != pl.get("up_to_date"):
        extrafile = os.path.join(pl["path"], ".extra.yaml")
        if os.path.exists(extrafile):
            with open(extrafile) as rd:
                extra = yaml.load(rd)
        else:
            extra = {}
        extra["up_to_date"] = up_to_date
        with open(extrafile, "w") as wd:
            yaml.dump(extra, wd)

    return {"id": pl.get("id"), "up_to_date": up_to_date}


def update(path):
    if not os.path.isdir(path):
        path = os.path.dirname(path)

    os.chdir(path)
    res = subprocess.run(
        ["git", "fetch", "--quiet"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT
    )
    if res.returncode != 0:
        return (False, res.stdout.decode("utf8"))

    res = subprocess.run(
        ["git", "merge", "-q"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT
    )
    if res.returncode != 0:
        return (False, res.stdout.decode("utf8"))

    plugin = get_plugin(path)
    check_update(plugin)
    clean_plugin_cache()

    if plugin.get("postinst"):
        res = subprocess.run(
            shlex.split(
                os.path.join(plugin.get("path"), plugin.get("postinst"))),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT
        )

    return (res.returncode == 0, res.stdout.decode("utf8"))


def update_all(ids):
    ret = []
    if not ids:
        ids = []
        for pl in all_plugins():
            if pl.get("up_to_date") not in (True, None):
                ids.append(pl.get("path"))

    for id in ids:
        if not id.startswith("/"):
            path = get_plugin(id)["path"]
        else:
            path = id
        (res, stdout) = update(path)
        ret.append({
            "id": get_plugin(id).get("id", path),
            "updated": res,
            "stdout": stdout,
        })

    output_data(ret)


def install_all(gits):
    ret = []
    for git in gits:
        res = install(git)
        ret.append(res)
    output_data(ret)


def install(git):
    os.chdir(install_path)
    res = subprocess.run(
        ["git", "clone", git],
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    stdout = res.stdout.decode('utf8')

    path = os.path.join(install_path, os.path.basename(git))
    if path.endswith(".git"):
        path = path[:-4]
    plugin = get_plugin(path)

    if res.returncode == 0 and plugin.get("postinst"):
        os.chdir(plugin["path"])
        res = subprocess.run(
            shlex.split(
                os.path.join(plugin.get("path"), plugin.get("postinst"))),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT
        )
        stdout += "\n\n" + res.stdout.decode('utf8')

    return {
        "id": plugin.get("id"),
        "success": res.returncode == 0,
        "version": plugin.get("version"),
        "stdout": stdout
    }


def remove_all(ids):
    ret = []
    for id in ids:
        res = remove(id)
        ret.append(res)
    output_data(ret)


def remove(id):
    plugin = get_plugin(id)
    if not plugin:
        if id.startswith("/"):
            return {"id": None, "path": id, "removed": False}
        return {"id": id, "path": None, "removed": False}
    try:
        shutil.rmtree(plugin["path"])
        return {"id": plugin["id"], "path": plugin["path"], "removed": True}
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"id": plugin["id"], "path": plugin["path"], "removed": False}


def list_(what=[]):
    if not what:
        what = ["id", "status", "version", "up_to_date"]
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
    if argv[0] == 'check':
        check_updates(argv[1:])
    if argv[0] == 'update':
        update_all(argv[1:])
    if argv[0] == 'install':
        install_all(argv[1:])
    if argv[0] == 'remove':
        remove_all(argv[1:])


if __name__ == "__main__":
    main(sys.argv[1:])
