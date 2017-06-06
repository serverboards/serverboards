#!/usr/bin/python3

import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__),'../bindings/python/'))
import serverboards
from serverboards import service, plugin

# Drastic to start clean
try:
    plugin.kill("serverboards.core.ssh/mgmt", _exception=False)
except:
    pass
try:
    plugin.kill("serverboards.core.ssh/daemon", _exception=False)
except:
    pass


mgmt = serverboards.Plugin("serverboards.core.ssh/mgmt")
ssh = serverboards.Plugin("serverboards.core.ssh/daemon")
me = os.environ["USER"]
service_uuid = None

@serverboards.rpc_method
def t01_ssh_create_service_test():
    global service_uuid
    # Create a service
    service_uuid = service.create(
        type="serverboards.core.ssh/ssh",
        name="SSH test to localhost",
        config={
            "url":"ssh://%s@localhost/"%me
        })
    serverboards.debug("Created service "+ repr(service_uuid))

@serverboards.rpc_method
def t02_ssh_add_fingerprints_test():
    # Get public SSH key
    ssh_public_key = mgmt.ssh_public_key()
    serverboards.debug("ssh_public_key %s"%ssh_public_key)

    assert ssh_public_key != None

    # add it to authorized_keys

    authorized_keys_path = "/home/%s/.ssh/authorized_keys"%os.environ["USER"]
    exists=False
    if os.path.isfile(authorized_keys_path):
        with open(authorized_keys_path, "r") as rd:
            if ssh_public_key in rd.read():
                serverboards.debug("SSH already in the users store to curent user keys, will try to connect using ssh")
                exists=True
    if not exists:
        with open(authorized_keys_path, "a") as wd:
            serverboards.debug("Adding the SSH key to curent user keys, will try to connect using ssh")
            wd.write("%s\n"%ssh_public_key)

    # Enable finger print if not enabled
    remote_fingerprint = mgmt.remote_fingerprint(url="localhost")
    serverboards.debug("remote fingerprint %s"%repr(remote_fingerprint))
    if not remote_fingerprint["enabled"]:
        ok = mgmt.toggle_remote_fingerprint(url="localhost", status=remote_fingerprint)
        serverboards.debug("add fingerprint? %s"%ok)
        assert ok == "Fingerprint added"

@serverboards.rpc_method
def t03_ssh_scp_test():
    # Copy a file using SCP
    try:
        os.unlink("/tmp/s10s-hosts-test")
    except:
        pass
    assert ssh.scp(None,"/etc/hosts", service_uuid, "/tmp/s10s-hosts-test") == True

    # Ensure it exists
    assert os.path.exists("/tmp/s10s-hosts-test")
    os.unlink("/tmp/s10s-hosts-test")

@serverboards.rpc_method
def t04_ssh_cleanup_test():
    # Disable fingerprint
    remote_fingerprint = mgmt.remote_fingerprint(url="localhost")
    assert mgmt.toggle_remote_fingerprint(url="localhost", status=remote_fingerprint) == "Fingerprint removed"

    # delete the service
    service.delete(service_uuid)

serverboards.loop()
