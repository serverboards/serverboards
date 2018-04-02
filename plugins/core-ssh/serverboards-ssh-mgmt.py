#!/usr/bin/python3
import sys
import os
import yaml
import urllib.parse as urlparse
sys.path.append(os.path.join(os.path.dirname(__file__), '../bindings/python/'))
from common import ensure_ID_RSA, ID_RSA_PUB, KNOWN_HOSTS_FILE
import serverboards_aio as serverboards
from serverboards_aio import print
from pcolor import printc
import curio
from curio import subprocess


@serverboards.rpc_method
async def ssh_public_key(**kwargs):
    await ensure_ID_RSA()
    with open(ID_RSA_PUB, 'r') as fd:
        return fd.read()


def ssh_urlparse(url):
    if "://" not in url:
        url = "ssh://%s" % (url)
    u = urlparse.urlparse(url)
    assert u.scheme == 'ssh'
    port = u.port or '22'
    return (u.hostname, str(port))


async def get_fingerprint(url, *args, **kwargs):
    if not url:
        return None
    (hostname, port) = ssh_urlparse(url)
    try:
        async with curio.timeout_after(5):
            output = str(await subprocess.check_output(
                ["ssh-keyscan", "-p", port, hostname]), 'utf8')
            output = output.strip().split('\n')
            output.sort()
            # serverboards.debug(repr(output))
            return '\n'.join(output)
    except curio.TaskTimeout:
        print("Timeout get fingerprint from: %s" % url)
        return None
    except Exception:
        import traceback
        traceback.print_exc()
        return None


@serverboards.rpc_method
async def remote_fingerprint(url="", options="", **kwargs):
    # print(url, options, repr(kwargs))
    fingerprint = await get_fingerprint(url, options)
    if not fingerprint:
        return {
            "fingerprint":
                "Cant connect to server at <%s>. Set a valid SSH address." %
                url,
            "className": "grey disabled",
            "toggle": "Select a valid SSH address",
            "enabled": False
        }
    fingerprintb = bytes(fingerprint, 'utf8')

    sp = subprocess.Popen(
        ["ssh-keygen", "-lf", "/dev/stdin", "-E", "md5"],
        stdin=subprocess.PIPE, stdout=subprocess.PIPE)
    fingerprint_md5, error = await sp.communicate(fingerprintb)

    sp = subprocess.Popen(
        ["ssh-keygen", "-lf", "/dev/stdin", "-E", "sha1"],
        stdin=subprocess.PIPE, stdout=subprocess.PIPE)
    fingerprint_sha1, error = await sp.communicate(fingerprintb)

    sp = subprocess.Popen(
        ["ssh-keygen", "-lf", "/dev/stdin", "-E", "sha256"],
        stdin=subprocess.PIPE, stdout=subprocess.PIPE)
    fingerprint_sha256, error = await sp.communicate(fingerprintb)

    fingerprint_text = ''.join([str(fingerprint_md5, 'utf8'), "\n", str(
        fingerprint_sha1, 'utf8'), "\n", str(fingerprint_sha256, 'utf8')])

    enabled = False
    if os.path.exists(KNOWN_HOSTS_FILE):
        with open(KNOWN_HOSTS_FILE, "r") as fd:
            enabled = fingerprint in fd.read()

    return {
        "fingerprint_orig": fingerprint,
        "fingerprint": fingerprint_text,
        "toggle": "Disable host" if enabled else "Enable host",
        "className": "red" if enabled else "yellow",
        "enabled": enabled
    }


@serverboards.rpc_method
async def toggle_remote_fingerprint(url=None, status=None, options="", **args):
    fingerprint = await get_fingerprint(url, options)

    enabled = False

    # serverboards.debug(repr(status["fingerprint_orig"]))
    # serverboards.debug(repr(fingerprint))
    # serverboards.debug(repr(status["fingerprint_orig"]==fingerprint))

    if status["fingerprint_orig"] == fingerprint:
        if os.path.exists(KNOWN_HOSTS_FILE):
            with open(KNOWN_HOSTS_FILE, "r") as fd:
                enabled = fingerprint in fd.read()
        if enabled:
            hostname = fingerprint.split(' ')[0]
            done = False
            with open(KNOWN_HOSTS_FILE, "r") as rd:
                with open(KNOWN_HOSTS_FILE + ".bak", "w") as wd:
                    for l in rd.readlines():
                        # serverboards.debug(repr((l[:10], hostname,
                        #                    l.startswith(hostname))))

                        if not l.startswith(hostname):
                            wd.write(l)
                        else:
                            done = True
            os.rename(KNOWN_HOSTS_FILE + ".bak", KNOWN_HOSTS_FILE)
            await serverboards.info(
                "Removed SSH known_host fingerprint for url %s" % (url))
            if done:
                return "Fingerprint removed"
            else:
                raise Exception(
                    "Could not remove fingerprint. Fingerprint not found. %s" %
                    (hostname))
        else:
            with open(KNOWN_HOSTS_FILE, "a") as fd:
                fd.write(fingerprint)
                fd.write('\n')
            await serverboards.info(
                "Added SSH known_host fingerprint for url %s" % (url))
            return "Fingerprint added"
    print("Orig: ", status["fingerprint_orig"])
    print("Real: ", fingerprint)
    raise Exception("Fingerprint has changed")


async def test():
    sys.stdout = sys.stderr
    import json
    printc("Start tests")

    ret = await ssh_public_key()
    printc("SSH public key", ret)

    status = await remote_fingerprint("ssh://localhost")
    printc("Fingerprints", json.dumps(status, indent=2), color="green")

    # Double toggle, let as was
    ret = await toggle_remote_fingerprint("ssh://localhost", status)
    printc(ret)

    ret = await toggle_remote_fingerprint("ssh://localhost", status)
    printc(ret)

    # print(get_fingerprint(
    #     "ssh://testurl",
    #     "User dmoreno\nProxyCommand ssh 192.168.1.200 -W 10.0.3.92:22 -q"
    # ))


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        mock_data = yaml.load(open("mock.yaml"))
        serverboards.test_mode(test, mock_data=mock_data)

    serverboards.loop()
