#!/usr/bin/python3

import sys, os, time, sh
sys.path.append(os.path.join(os.path.dirname(__file__),'../bindings/python/'))
import serverboards, hashlib
from serverboards import service, plugin, file, rpc, print

mgmt = None
ssh = None
me = os.environ["USER"]
service_uuid = None


# Drastic to start clean
@serverboards.rpc_method
def t00_start_test():
  global mgmt, ssh
  try:
      plugin.kill("serverboards.core.ssh/mgmt", _exception=False)
  except:
      pass
  try:
      plugin.kill("serverboards.core.ssh/daemon", _exception=False)
  except:
      pass
  time.sleep(1)

  mgmt = serverboards.Plugin("serverboards.core.ssh/mgmt")
  ssh = serverboards.Plugin("serverboards.core.ssh/daemon")

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
    sh.mkdir("-p", "/home/%s/.ssh/"%os.environ["USER"])
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
    if not remote_fingerprint["enabled"]: # should have this key
        ok = mgmt.toggle_remote_fingerprint(url="localhost", status=remote_fingerprint)
        serverboards.debug("add fingerprint? %s"%ok)
        assert ok == "Fingerprint added", ok

@serverboards.rpc_method
def t03_ssh_scp_test_():
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
def t04_ssh_backup_test():
  url_orig = "localhost"
  url_dest = "localhost"
  file_orig = "/etc/services"
  file_dest = "/tmp/services.tmp"
  try:
     os.unlink(file_dest)
  except:
    pass

  [_wfd, rfd] = ssh.popen(service_uuid, ["cat", file_orig])
  #print("Popen1 done")
  [wfd, _rfd] = ssh.popen(service_uuid, ["dd", "bs=1k", "of=%s"%file_dest])
  #print("Popen2 done")

  #print(rpc.call("dir"))

  #print("Read first block")
  block = file.read(rfd) ### not kill read when file is closed.
  while block:
    #print("Readed block of size %d from %s"%(len(block), rfd))
    w = file.write(wfd, block)
    #print("Writed block of size %s to %s"%(w, wfd))
    block = file.read(rfd)
  #print("EOF?")

  file.sync(wfd)
  #print("EOF")
  file.close(_wfd)
  file.close(wfd)
  file.close(_rfd)
  file.close(rfd)
  #print("Closed all")

  time.sleep(1) # wait to settle

  assert os.stat(file_dest)

  import subprocess
  psoutput = subprocess.check_output("ps aux | grep [o]f=/tmp/ || true", shell=True)
  assert not psoutput, "dd still running\n%s"%psoutput

  size_orig = os.path.getsize(file_orig)
  size_dest = os.path.getsize(file_dest)
  assert size_orig == size_dest, "%s != %s"%(size_orig, size_dest)
  sha_orig = hashlib.sha1(open(file_orig,'rb').read()).hexdigest()
  sha_dest = hashlib.sha1(open(file_dest,'rb').read()).hexdigest()
  assert sha_orig == sha_dest, "%s != %s"%(sha_orig, sha_dest)
  #print("Done!")


@serverboards.rpc_method
def t99_ssh_cleanup_service_test():
    # delete the service
    service.delete(service_uuid)

@serverboards.rpc_method
def t99_ssh_cleanup_fingerprint_test():
    # Disable fingerprint
    remote_fingerprint = mgmt.remote_fingerprint(url="localhost")
    assert mgmt.toggle_remote_fingerprint(url="localhost", status=remote_fingerprint) == "Fingerprint removed"

serverboards.loop()
