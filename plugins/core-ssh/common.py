import os
import serverboards_aio as serverboards
import curio

ID_RSA = os.path.expanduser("~/id_rsa")
CONFIG_FILE = os.path.expanduser("~/ssh_config")
KNOWN_HOSTS_FILE = os.path.expanduser("~/known_hosts")
ID_RSA_PUB = ID_RSA + '.pub'


async def ensure_ID_RSA():
    if not os.path.exists(ID_RSA):
        await serverboards.info("Generating new SSH key pair")
        await curio.subprocess.check_output(
            ['ssh-keygen', '-f', ID_RSA,  '-N', ''])
        os.chmod(ID_RSA, 0o0600)
    if not os.path.exists(CONFIG_FILE):
        await serverboards.info("Creating the ssh config file")
        with open(CONFIG_FILE, "w+") as fd:
            fd.write("UserKnownHostsFile %s" % KNOWN_HOSTS_FILE)
            fd.write("\n\n")
            fd.write("# Write here your custom configuration\n")
        os.chmod(CONFIG_FILE, 0o0600)
