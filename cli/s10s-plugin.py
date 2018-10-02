#!/usr/bin/python3

import sys
import os
import yaml
import json
import subprocess
import re
import shlex
import shutil
import glob
import configparser
import logging
import tarfile
import requests
import tempfile


__doc__ = """s10s plugin -- Plugin management
Allows to install, uninstall and update plugins.

It uses git URLS to manage the state.

Plugin management:
    s10s plugin list [what]   -- Lists all the plugins
    s10s plugin check         -- Checks if there is something to update
    s10s plugin install <plugin_id|url|txz>   -- Installs a plugin
    s10s plugin remove  <path|plugin_id>      -- Removes a plugin
    s10s plugin update  <path|plugin_id>      -- Updates a plugin
    s10s plugin login         -- Logins into the plugin registry. Required for some plugins.
    s10s plugin search        -- Remote search of a plugin form the remote database.

Some actions may need authentication. The server may ping back to the SSH
connection of the current server to ensure identity (SSH public keys hashes).

Use `s10s plugin login` to attach your account with the server.
"""

os.environ["LC_ALL"] = "en_US.UTF-8"  # venv needs this...
os.environ["LC_CTYPE"] = "en_US.UTF-8"  # venv needs this...
paths = []
install_path = None
format = "text"
settings = None
inis = [
    os.path.expandvars("${HOME}/.local/serverboards/serverboards.ini"),
    os.path.expandvars("${SERVERBOARDS_PATH}/serverboards.ini"),
    *glob.glob("/etc/serverboards/*.ini"),
    "/etc/serverboards.ini",
    os.environ.get("SERVERBOARDS_INI", "")
]


def clean_ini_entry(v):
    if isinstance(v, str) and v.startswith('"') and v.endswith('"'):
        return v[1:-1]
    return v


def read_settings():
    """
    At startup reads the settings and put them in a settings singleton
    """
    def get_settings():
        """
        Returns the full dictionary with the settings of this installation.
        """

        settings = {}
        for ini in inis:
            if os.path.exists(ini):
                try:
                    config = configparser.ConfigParser(allow_no_value=True)
                    config.read(ini)
                    for section in config.sections():
                        prev = settings.get(section, {})
                        prev.update({k: clean_ini_entry(v) for k, v in config.items(section)})
                        settings[section] = prev
                except Exception:
                    pass
        return settings

    # real settings readding
    global paths, install_path, settings
    settings = get_settings()

    paths = (
        os.environ.get("SERVERBOARDS_PLUGINS_PATH")
        or settings.get("plugins", {}).get('path')
        or os.path.expandvars(
            "${HOME}/.local/serverboards/plugins;"
            "${SERVERBOARDS_PATH}/plugins;"
            "/opt/serverboards/local/plugins/;"
            "/opt/serverboards/share/serverboards/plugins/;"
            "../plugins/")
    ).split(';')
    paths = [os.path.abspath(x) for x in paths if os.path.isdir(x)]
    install_path = paths[0]


def update_settings(section, key, value):
    for ini in inis:
        if os.path.exists(ini):
            try:
                config = configparser.ConfigParser(allow_no_value=True)
                config.read(ini)
                if section in config:
                    config = configparser.ConfigParser(allow_no_value=True, comment_prefixes="·")
                    config.read(ini)
                    if value is None:
                        if key in config[section]:
                            del config[section][key]
                    else:
                        config[section][key] = value
                    with open(ini, "w") as inif:
                        config.write(inif)
                    # done
                    return
            except Exception:
                pass
    # new value
    if value is None:
        return
    # add to first, which sould be user's defined
    config = config.read(inis[0])
    config[section] = {key: value}
    with open(ini[0], "w") as inif:
        config.write(inif)


def output_data(data):
    if format == "json":
        print(json.dumps(data))
        return

    if not data:
        return

    if isinstance(data, dict):
        data = [data]

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
                data = yaml.safe_load(fd)
                if not data:
                    raise Exception("cant read %s" % manifest)
                data["status"] = "ok"
        except yaml.scanner.ScannerError as e:
            data = {
                "id": manifest,
                "status": "manifest-broken",
                "message": str(e)
            }
        except Exception as e:
            data = {
                "id": manifest,
                "status": "no-manifest",
                "message": str(e)
            }
        extra = os.path.join(path, ".extra.yaml")
        try:
            if os.path.exists(extra):
                with open(extra) as fd:
                    data.update(yaml.safe_load(fd))
        except Exception:
            extra = {}

        if 'source' not in data:
            gitdir = os.path.join(path, ".git")
            if os.path.exists(gitdir):
                data["source"] = "git"

        data["path"] = path
        if not data.get("latest"):
            data['latest'] = data.get('version')
        data["updated"] = data.get("version") == data.get("latest")
        return data
    return {}


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


AHEAD_RE = re.compile(b".*\\[behind (\\d*)\\].*")


def check_update(pl):
    print("Check", pl["id"], file=sys.stderr)
    latest = None
    if pl.get("source") == "packageserver":
        latest = check_update_remote(pl)
    elif pl.get("source") == "git":
        latest = check_update_git(pl)
    if latest is not None:
        extrafile = os.path.join(pl["path"], ".extra.yaml")
        extra = {}
        try:
            if os.path.exists(extrafile):
                with open(extrafile) as rd:
                    extra = yaml.safe_load(rd)
        except Exception:
            logging.error("Could not load extra data from %s" % extrafile)
        extra["latest"] = latest
        with open(extrafile, "w") as wd:
            yaml.safe_dump(extra, wd)
    return {"id": pl["id"], "latest": latest}


def check_update_git(pl):
    os.chdir(pl["path"])
    os.system("git fetch --quiet")
    output = subprocess.run(
        ["git", "status", "--porcelain", "--branch"],
        stdout=subprocess.PIPE
    )
    m = AHEAD_RE.match(output.stdout)
    latest = pl.get("version")
    if m:
        latest = "%s+%s" % (pl.get("version", "0"), m.groups(1)[0].decode('utf8'))

    return latest


def check_update_remote(pl):
    data = packageserver_get("packages/%s" % pl["id"]).json()
    return data["version"]


def update(id_or_path):
    plugin = get_plugin(id_or_path)
    source = plugin.get("source", "unknown")
    res = False
    stdout = None

    if source == 'git':
        (res, stdout) = update_git(source)
    if source == 'packageserver':
        install_res = install_packageserver(plugin["id"])
        res = install_res["success"]
        stdout = install_res["stdout"]

    return {
        "id": plugin["id"],
        "source": source,
        "updated": res,
        "stdout": stdout,
    }


def update_git(path):
    logging.info("Update %s" % path)
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
            if pl.get("latest") not in (True, None):
                ids.append(pl.get("id"))

    for id in ids:
        ret.append(update(id))

    output_data(ret)


def install_all(gits):
    ret = []
    for git in gits:
        res = install(git)
        ret.append(res)
    output_data(ret)


def install_git(git):
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
        open(os.path.join(path, 'install.log'), 'wt').write(stdout)

    return {
        "id": plugin.get("id"),
        "success": res.returncode == 0,
        "version": plugin.get("version"),
        "requires": plugin.get("requires", []),
        "stdout": stdout
    }


def install_packageserver(pkgid):
    print("Install from remote", pkgid, file=sys.stderr)
    res = packageserver_get("packages/%s/package.txz" % pkgid)
    if res.status_code != 200:
        return res.json()

    data = res.content
    with tempfile.NamedTemporaryFile(suffix=".txz") as fd:
        print("Temporay file", fd.name, file=sys.stderr)
        fd.write(data)
        fd.flush()
        pl = install_file(fd.name)
        with open(pl["path"]+'/.extra.yaml', 'w') as fd:
            fd.write("source: packageserver\n")
        return pl


def install_file(filename):
    manifest = None
    with tarfile.open(filename, 'r:xz') as fd:
        prefix = None
        manifest_path = None
        for m in fd.getmembers():
            if not prefix:
                prefix = m.name.split('/')[0]
                if not prefix:
                    raise Exception("Can not install packages at /. Shame on you.")
                manifest_path = '%s/manifest.yaml' % prefix
            else:
                if not m.name.startswith(prefix):
                    raise Exception("Not all files in the same directory")
            if '..' in m.name:
                raise Exception("Packages files can not have any '..' directory")

            if m.name == manifest_path:
                manifest = yaml.safe_load(fd.extractfile(m))

        if manifest['id'] != prefix:
            raise Exception("id does not match prefix")

        # ALL OK and safe. Uncompress.
        fd.extractall(path=install_path)

    path = "%s/%s/" % (install_path, manifest["id"])

    success = True
    stdout = None
    if manifest.get("postinst"):
        os.chdir(path)
        res = subprocess.run(
            shlex.split(
                os.path.join(path, manifest.get("postinst"))),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT
        )
        stdout = res.stdout.decode('utf8')
        open(os.path.join(path, 'install.log'), 'wt').write(stdout)
        success = res.returncode == 0

    return {
        "id": manifest.get("id"),
        "success": success,
        "version": manifest.get("version"),
        "requires": manifest.get("requires", []),
        "path": path,
        "stdout": stdout
    }


def install(package):
    """
    Installs a package into the system.abs

    If the package have dependencies it maybe_install them too.
    """
    logging.info("Install %s to %s" % (package, install_path))
    if '//' in package:
        pl = install_git(package)
    elif '@' in package:
        pl = install_git(package)
    elif os.path.exists(package):
        pl = install_file(package)
    else:
        if '/' in package:
            return {"error": "not found"}
        pl = install_packageserver(package)

    for dep in pl["requires"]:
        maybe_install(dep)

    return pl


def maybe_install(package):
    """
    Checks if package already installed and if so does nothing.
    """
    pl = get_plugin(package)
    if pl:
        return pl
    return install(package)


def remove_all(ids):
    ret = []
    for id in ids:
        res = remove(id)
        ret.append(res)
    output_data(ret)


def remove(id):
    logging.info("Remove %s" % id)
    plugin = get_plugin(id)
    if not plugin:
        if id.startswith("/"):
            return {"id": None, "path": id, "removed": False}
        return {"id": id, "path": None, "removed": False}
    try:
        shutil.rmtree(plugin["path"])
        return {"id": plugin["id"], "path": plugin["path"], "removed": True}
    except Exception:
        import traceback
        traceback.print_exc()
        return {"id": plugin["id"], "path": plugin["path"], "removed": False}


def list_(what=[]):
    if not what:
        what = ["id", "status", "version", "updated"]
    res = []
    for pl in all_plugins():
        res.append({k: pl.get(k) for k in what})
    if 'id' in what:
        res.sort(key=lambda x: x["id"])
    output_data(res)


def packageserver_get(path, **params):
    """
    Encapsulates a HTTP GET to send proper requests to package server
    """
    packageserver_settings = settings.get("serverboards.packageserver/settings", {})
    api_key = packageserver_settings.get("api_key", "anonymous")
    packageserver_url = os.environ.get(
        "SERVERBOARDS_PACKAGESERVER_URL",
        packageserver_settings.get("url", "https://serverboards.app")
    )

    try:
        res = requests.get("%s/api/%s" % (packageserver_url, path), params=params, headers={"Api-Key": api_key})
        if res.status_code != 200:
            if res.headers["Content-Type"] == "application/json":
                if format == 'json':
                    print(res.content.decode('utf8'))
                else:
                    print("Error: %s" % res.json()["message"], file=sys.stderr)
            else:
                if format == 'json':
                    print('{"error": "unknown", "message": "Bad response from server"}')
                else:
                    print("Error: Bad response from server", file=sys.stderr)
            sys.exit(1)
    except Exception:
        if format == 'json':
            print('{"error": "cant-connect", "message": "Cant connect to server"}')
        else:
            print("Cant connect to server", file=sys.stderr)
        sys.exit(1)

    return res


def search(*terms):
    res = packageserver_get("packages/search", q=' '.join(terms))
    js = res.json().get("results", [])
    output_data(js)


def login(email=None, password=None):
    """
    Logins into the boards server.
    """
    packageserver_settings = settings.get("serverboards.packageserver/settings", {})
    api_key = packageserver_settings.get("api_key")
    if api_key:
        res = {"error": "already-loggedin", "message": "You are already logged in. Need to logout before try again."}
        output_data(res)
        return

    if not email:
        email = input("Email: ")
    if not password:
        import getpass
        password = getpass.getpass("Password: ")

    packageserver_url = os.environ.get(
        "SERVERBOARDS_PACKAGESERVER_URL",
        packageserver_settings.get("url", "https://serverboards.app")
    )

    ret = requests.post(packageserver_url + "/api/login", {"email": email, "password": password})
    if ret.status_code != 200:
        res = {
            "status": "error",
            "message": "invalid user or password"
        }
    else:
        update_settings("serverboards.packageserver/settings", "api_key", ret.json()["api_key"])
        res = {"success": "logged-in", "message": "You are succesfully logged in"}
    output_data(res)


def logout():
    """
    Logs out of the marketplace.
    """
    packageserver_settings = settings.get("serverboards.packageserver/settings", {})
    api_key = packageserver_settings.get("api_key")
    if not api_key:
        res = {"error": "not-loggedin", "message": "You are not logged in."}
        output_data(res)
        return

    update_settings("serverboards.packageserver/settings", "api_key", None)
    res = {"success": "logged-out", "message": "You are succesfully logged out"}
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
    elif argv[0] == '--help' or argv[0] == 'help':
        print(__doc__)
        sys.exit(0)
    elif argv[0] == 'list':
        list_(argv[1:])
    elif argv[0] == 'check':
        check_updates(argv[1:])
    elif argv[0] == 'update':
        update_all(argv[1:])
    elif argv[0] == 'install':
        install_all(argv[1:])
    elif argv[0] == 'remove':
        remove_all(argv[1:])
    elif argv[0] == 'search':
        search(*argv[1:])
    elif argv[0] == 'login':
        login(*argv[1:])
    elif argv[0] == 'logout':
        logout()
    else:
        print("Unknown command: %s" % argv[0])
        print(__doc__)
        sys.exit(1)


read_settings()
if __name__ == "__main__":
    main(sys.argv[1:])
